/**
 * tauriService.js — Comunicación con el sidecar Python via Tauri v2 (SQLite).
 * Reescrito para máxima robustez. 
 * 
 * IMPORTANTE: En Tauri v2, `stdout.on('data')` entrega datos LÍNEA POR LÍNEA,
 * no como chunks crudos. Por eso NO necesitamos buffer de fragmentación.
 */

import { Command } from "@tauri-apps/plugin-shell";
import { exists, copyFile, mkdir } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { resolveResource } from "@tauri-apps/api/path";

const SIDECAR = "binaries/sunat-sidecar";
let DB_PATH = "data/empresa.db";
let sidecarReady = false;
let initDatabasePromise = null;
let initDatabaseResult = null;

// ── Estado global del servidor persistente ──
const pending = new Map();
let server = null;

// ── Verificar Tauri IPC ──
function hasTauri() {
    return typeof window !== "undefined" && window.__TAURI_INTERNALS__;
}

async function getDatabasePaths() {
    const [dbDir, finalDbPath, masterKeyPath] = await invoke("get_storage_paths");

    return {
        dbDir,
        finalDbPath,
        masterKeyPath,
        cleanDbPath: finalDbPath.replace("\\\\?\\", "").replace("//?/", ""),
    };
}

async function tryCopyBundledDb(finalDbPath) {
    const pathsToTry = [
        "data/empresa.db",
        "data/empresas.db",
        "data/plantilla.db",
        "empresa.db",
        "empresas.db",
        "_up_/data/empresas.db",
    ];

    for (const resourcePath of pathsToTry) {
        try {
            const resolvedPath = await resolveResource(resourcePath);
            if (resolvedPath && await exists(resolvedPath)) {
                await copyFile(resolvedPath, finalDbPath);
                console.log(`[db] Plantilla copiada desde recurso: ${resourcePath}`);
                return true;
            }
        } catch (_) {
            // Ignorar rutas faltantes y continuar con el siguiente fallback.
        }
    }

    return false;
}

// ── Iniciar servidor persistente ──
async function getServer() {
    if (server) return server;

    if (!hasTauri()) {
        throw new Error("Tauri IPC no disponible. Use la ventana de escritorio.");
    }

    console.log("[sidecar] Iniciando servidor persistente...");
    const cmd = Command.sidecar(SIDECAR, ["server"], {
        env: { PYTHONIOENCODING: "utf-8", PYTHONLEGACYWINDOWSSTDIO: "0" }
    });

    const child = await cmd.spawn();
    server = { cmd, child };

    // ── Recibir datos de stdout ──
    cmd.stdout.on("data", (line) => {
        const raw = typeof line === "string" ? line.trim() : String(line).trim();
        if (!raw) return;

        console.log("[sidecar] stdout:", raw.substring(0, 120));

        try {
            const obj = JSON.parse(raw);

            // Mensaje de "server ready" — ignorar
            if (obj.server === "ready") {
                console.log("[sidecar] Servidor listo.");
                sidecarReady = true;
                return;
            }

            // Buscar request_id para resolver la promesa
            if (obj.request_id && pending.has(obj.request_id)) {
                const { resolve, reject } = pending.get(obj.request_id);
                pending.delete(obj.request_id);

                if (obj.error) {
                    reject(new Error(obj.error));
                } else {
                    resolve(obj);
                }
            } else {
                console.log("[sidecar] Respuesta sin match:", obj);
            }
        } catch (e) {
            console.warn("[sidecar] No-JSON:", raw);
        }
    });

    cmd.stderr.on("data", (line) => {
        console.warn("[sidecar] stderr:", line);
    });

    cmd.on("close", () => {
        console.log("[sidecar] Servidor cerrado.");
        for (const [, { reject }] of pending) {
            reject(new Error("Sidecar cerrado inesperadamente."));
        }
        pending.clear();
        server = null;
        sidecarReady = false;
    });

    return server;
}

// ── Enviar comando al sidecar ──
async function runSidecar(args) {
    if (!hasTauri()) {
        throw new Error("Tauri IPC no disponible.");
    }

    const srv = await getServer();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const payload = [...args, "--request-id", id];

    console.log("[sidecar] →", payload[0], "id:", id);

    return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });

        // Escribir comando al stdin del sidecar
        srv.child.write(JSON.stringify(payload) + "\n");

        // Timeout de 90 segundos para procesos largos
        setTimeout(() => {
            if (pending.has(id)) {
                pending.delete(id);
                reject(new Error(`Timeout (90s) para: ${args[0]}`));
            }
        }, 90000);
    });
}

/**
 * Detener el servidor persistente manualmente.
 * Útil antes de operaciones de archivo (como Restore) que requieren que la DB no esté bloqueada.
 */
export async function stopServer() {
    if (server && server.child) {
        console.log("[sidecar] Deteniendo servidor...");
        try {
            await server.child.kill();
        } catch (e) {
            console.warn("[sidecar] Error al aplicar kill:", e);
        }
        server = null;
        sidecarReady = false;
        // Pequeña espera para asegurar que el SO libere el archivo
        await new Promise(r => setTimeout(r, 500));
    }
}

// ── Almacén para procesos activos de login ──
const activeLogins = new Map();

/**
 * Lanzar el sidecar de forma asíncrona (non-blocking).
 * Útil para procesos largos como el login que mantienen el navegador abierto.
 */
export async function spawnSidecar(args, onStatusUpdate) {
    try {
        const command = Command.sidecar(SIDECAR, args, {
            env: {
                PYTHONIOENCODING: "utf-8",
                PYTHONLEGACYWINDOWSSTDIO: "0"
            }
        });

        command.stderr.on("data", (line) => {
            console.log("Sidecar stderr:", line);
            if (onStatusUpdate) onStatusUpdate(line);
        });

        const child = await command.spawn();
        const processId = Date.now().toString();
        activeLogins.set(processId, { command, child });

        command.on("close", (data) => {
            console.log(`Sidecar login ${processId} cerrado con código ${data.code}`);
            activeLogins.delete(processId);
        });

        // Resolvemos de inmediato para que la UI regrese a su estado listo "flash"
        return { success: true, message: "Login iniciado..." };
    } catch (error) {
        console.error("Error spawnSidecar:", error);
        throw error;
    }
}

// ==================== EMPRESAS ====================

export async function getEmpresas() {
    return runSidecar(["list-empresas", "--db", DB_PATH]);
}

export async function addEmpresa(empresaData) {
    return runSidecar([
        "add-empresa", "--db", DB_PATH,
        "--data", JSON.stringify(empresaData),
    ]);
}

export async function updateEmpresa(id, empresaData) {
    return runSidecar([
        "update-empresa", "--db", DB_PATH,
        "--id", String(id),
        "--data", JSON.stringify(empresaData),
    ]);
}

export async function deleteEmpresa(id) {
    return runSidecar([
        "delete-empresa", "--db", DB_PATH,
        "--id", String(id),
    ]);
}

// ==================== LOGIN SUNAT ====================

export async function loginSunat(empresaId, browser, engine, portal) {
    const args = [
        "login-sunat", "--db", DB_PATH,
        "--id", String(empresaId),
    ];
    if (browser) args.push("--browser", browser);
    if (engine) args.push("--engine", engine);
    if (portal) args.push("--portal", portal);

    // Usamos runSidecar para envío ultra-rápido (flash) al servidor existente
    // El servidor python maneja la tarea en un hilo interno sin bloquear.
    return runSidecar(args);
}

// ==================== CONSULTA RUC ====================

export async function consultarRuc(ruc) {
    return runSidecar(["consultar-ruc", "--ruc", ruc]);
}

// ==================== SETUP ====================

/**
 * Inicializa la base de datos en AppData/Local.
 * Si no existe, la copia desde los recursos del paquete.
 */
export async function initDatabase() {
    if (!hasTauri()) return;
    if (initDatabaseResult) return initDatabaseResult;
    if (initDatabasePromise) return initDatabasePromise;

    initDatabasePromise = (async () => {
        console.log("[db] Iniciando initDatabase...");
        const { dbDir, finalDbPath, masterKeyPath, cleanDbPath } = await getDatabasePaths();
        console.log("[db] Path normalizado para Python:", cleanDbPath);

        if (!(await exists(dbDir))) {
            console.log("[db] Creando directorio:", dbDir);
            await mkdir(dbDir, { recursive: true });
        }

        if (!(await exists(finalDbPath))) {
            console.log("[db] DB no encontrada en AppData. Buscando plantilla...");
            const copied = await tryCopyBundledDb(finalDbPath);
            if (!copied) {
                console.log("[db] No se encontró plantilla, el sidecar creará una nueva DB.");
            }
        } else {
            console.log("[db] DB ya existe en AppData.");
        }

        DB_PATH = cleanDbPath;

        if (await exists(finalDbPath) && await exists(masterKeyPath)) {
            console.log("[db] DB y master.key ya existen. Se omite setup inicial.");
            initDatabaseResult = { success: true, path: cleanDbPath, reused: true };
            return initDatabaseResult;
        }

        console.log("[db] Ejecutando setupDatabase inicial (one-shot) en AppData...");
        const setupResult = await setupDatabaseOneShot(cleanDbPath);
        console.log("[db] Setup inicial completado:", setupResult);

        if (!(await exists(finalDbPath))) {
            throw new Error(`Fallo crítico: La base de datos no se pudo crear en ${finalDbPath}`);
        }

        if (!(await exists(masterKeyPath))) {
            console.warn("[db] Setup completado sin master.key. Se creará al guardar credenciales.");
        }

        console.log("[db] Inicialización exitosa y persistente en AppData.");
        initDatabaseResult = { success: true, path: cleanDbPath };
        return initDatabaseResult;
    })().catch((error) => {
        console.error("[db] Error CRÍTICO en initDatabase:", error);
        throw error;
    }).finally(() => {
        initDatabasePromise = null;
    });

    return initDatabasePromise;
}

/**
 * Ejecuta el setup de la base de datos usando un proceso sidecar independiente.
 * Esto es más seguro durante el arranque que usar el servidor compartido.
 */
async function setupDatabaseOneShot(path) {
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
            return await new Promise((resolve, reject) => {
                const cmd = Command.sidecar(SIDECAR, ["setup-db", "--db", path], {
                    env: { PYTHONIOENCODING: "utf-8", PYTHONLEGACYWINDOWSSTDIO: "0" }
                });

                const stdoutLines = [];
                const stderrLines = [];

                cmd.stdout.on("data", (line) => {
                    const text = typeof line === "string" ? line.trim() : String(line).trim();
                    if (text) stdoutLines.push(text);
                });

                cmd.stderr.on("data", (line) => {
                    const text = typeof line === "string" ? line.trim() : String(line).trim();
                    if (text) {
                        stderrLines.push(text);
                        console.warn("[setup-db] stderr:", text);
                    }
                });

                cmd.on("close", (data) => {
                    console.log(`[setup-db] Intento ${attempt} cerrado con código ${data.code}.`);
                    if (data.code !== 0) {
                        reject(new Error(
                            `Setup falló con código ${data.code}. ${stderrLines.join(" | ") || stdoutLines.join(" | ")}`
                        ));
                        return;
                    }

                    for (let i = stdoutLines.length - 1; i >= 0; i -= 1) {
                        try {
                            const parsed = JSON.parse(stdoutLines[i]);
                            if (parsed.success === false) {
                                reject(new Error(parsed.message || "Fallo en setup_all"));
                            } else {
                                resolve(parsed);
                            }
                            return;
                        } catch (_) {
                            // Continuar hasta encontrar la última línea JSON válida.
                        }
                    }

                    resolve({ success: true, message: "Setup finalizado" });
                });

                cmd.on("error", (error) => reject(error));
                cmd.spawn().catch(reject);
            });
        } catch (error) {
            lastError = error;
            console.warn(`[setup-db] Intento ${attempt} fallido:`, error);
            if (attempt < 2) {
                await new Promise((resolve) => setTimeout(resolve, 250));
            }
        }
    }

    throw lastError;
}

export async function setupDatabase() {
    return runSidecar(["setup-db", "--db", DB_PATH]);
}
