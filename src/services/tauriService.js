/**
 * tauriService.js — Comunicación con el sidecar Python via Tauri v2.
 * Reescrito para máxima robustez. 
 * 
 * IMPORTANTE: En Tauri v2, `stdout.on('data')` entrega datos LÍNEA POR LÍNEA,
 * no como chunks crudos. Por eso NO necesitamos buffer de fragmentación.
 */

import { Command } from "@tauri-apps/plugin-shell";
import { exists, copyFile, mkdir, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appLocalDataDir, join, resolveResource } from "@tauri-apps/api/path";

const SIDECAR = "binaries/sunat-sidecar";
let DB_PATH = "data/empresas.accdb"; // Fallback inicial

// ── Estado global del servidor persistente ──
const pending = new Map();
let server = null;

// ── Verificar Tauri IPC ──
function hasTauri() {
    return typeof window !== "undefined" && window.__TAURI_INTERNALS__;
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

    try {
        console.log("[db] Iniciando initDatabase...");
        const dataDir = await appLocalDataDir();
        const dbDir = await join(dataDir, "data");
        const finalDbPath = await join(dbDir, "empresas.accdb");
        const masterKeyPath = await join(dbDir, "master.key");

        console.log("[db] AppData path:", finalDbPath);

        // 1. Asegurar que la carpeta existe
        if (!(await exists(dbDir))) {
            console.log("[db] Creando directorio:", dbDir);
            await mkdir(dbDir, { recursive: true });
        }

        // 2. Si la DB no existe, copiarla desde recursos
        if (!(await exists(finalDbPath))) {
            console.log("[db] DB no encontrada en AppData. Buscando en recursos...");

            let resourceDb = "";
            const pathsToTry = ["data/empresas.accdb", "empresas.accdb", "_up_/data/empresas.accdb"];

            for (const p of pathsToTry) {
                try {
                    resourceDb = await resolveResource(p);
                    if (await exists(resourceDb)) {
                        console.log(`[db] Recurso encontrado en (${p}):`, resourceDb);
                        break;
                    }
                } catch (e) {
                    console.warn(`[db] No se encontró el recurso en path: ${p}`);
                }
            }

            if (!resourceDb) {
                throw new Error("No se pudo localizar el recurso empresas.accdb en el paquete del instalador.");
            }

            await copyFile(resourceDb, finalDbPath);
            console.log("[db] Copia de DB completada.");

            // Copiar también la master.key si existe en recursos
            try {
                const resourceKey = await resolveResource("data/master.key");
                await copyFile(resourceKey, masterKeyPath);
                console.log("[db] Copia de master.key completada.");
            } catch (e) {
                try {
                    const resourceKey = await resolveResource("master.key");
                    await copyFile(resourceKey, masterKeyPath);
                    console.log("[db] Copia de master.key completada (root).");
                } catch (e2) {
                    console.warn("[db] No se encontró master.key en recursos.");
                }
            }
        } else {
            console.log("[db] DB ya existe en AppData.");
        }

        DB_PATH = finalDbPath;

        // Ejecutar el comando de setup del sidecar para asegurar tablas/contraseña
        console.log("[db] Ejecutando setupDatabase en sidecar...");
        const response = await setupDatabase();
        console.log("[db] Setup completado:", response);
        return response;
    } catch (error) {
        console.error("[db] Error CRÍTICO en initDatabase:", error);
        // Retornar error descriptivo para el UI
        throw new Error(error.message || String(error));
    }
}

export async function setupDatabase() {
    return runSidecar(["setup-db", "--db", DB_PATH]);
}
