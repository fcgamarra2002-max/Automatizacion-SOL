/**
 * App principal — Estilo SUNAT Smart Access
 * Sidebar + Contenido principal con cards de empresa
 */

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  getEmpresas,
  addEmpresa,
  updateEmpresa,
  deleteEmpresa,
  loginSunat,
  initDatabase,
  spawnSidecar
} from "./services/tauriService";
import EmpresaCard from "./components/EmpresaCard";
import EmpresaForm from "./components/EmpresaForm";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import ConfirmDialog from "./components/ConfirmDialog";
import PortalSelector from "./components/PortalSelector";
import { IconSun, IconMoon, IconDownload, IconUpload, IconUpdate } from "./components/Icons";
import { invoke } from "@tauri-apps/api/core";
import { save, open, ask, message as tauriMessage } from "@tauri-apps/plugin-dialog";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import "./App.css";

export default function App() {
  const [empresas, setEmpresas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmEdit, setConfirmEdit] = useState(null);
  const [portalEmpresa, setPortalEmpresa] = useState(null);
  const [portalGroup, setPortalGroup] = useState("SUNAT");
  const [theme, setTheme] = useState("light");
  const [sortByLastRuc, setSortByLastRuc] = useState(true);
  const [error, setError] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const handleManualUpdate = async () => {
    setLoading(true);
    setStatusMsg("Buscando actualizaciones...", "info");
    try {
      const update = await check();
      if (update?.available) {
        setUpdateAvailable(true);
        const yes = await ask(`Actualización a ${update.version} disponible!\n\nNotas de la versión:\n${update.body}`, {
          title: 'Actualización de SUNAT Automation',
          kind: 'info',
          okLabel: 'Actualizar y Reiniciar',
          cancelLabel: 'Más tarde'
        });
        if (yes) {
          setStatusMsg("Descargando actualización...", "info");
          await update.downloadAndInstall();
          await relaunch();
        } else {
          setStatusMsg("Actualización pospuesta", "info");
        }
      } else {
        setStatusMsg("La aplicación está actualizada", "success");
        await tauriMessage("Ya tienes la última versión instalada.", { title: "Sin actualizaciones", kind: "info" });
      }
    } catch (error) {
      console.error("Error al buscar actualizaciones:", error);
      setStatusMsg("Error al buscar actualizaciones", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpresas = async () => {
    // Phase 1: Try to load from cache first for immediate feel
    const cached = localStorage.getItem("sunat_data_v1");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setEmpresas(parsed);
        setFiltered(parsed);
      } catch (e) { console.error("Cache error", e); }
    }

    setLoading(true);
    try {
      const result = await getEmpresas();
      const data = Array.isArray(result) ? result : (result.data || []);
      setEmpresas(data);
      setFiltered(data);
      // Save to cache
      localStorage.setItem("sunat_data_v1", JSON.stringify(data));
      setStatusMsg(`${data.length} empresa(s) cargadas`, "success");
      setError(null);
    } catch (err) {
      if (!cached) {
        setEmpresas([]);
        setFiltered([]);
        setStatusMsg("No se encontraron datos registrados.", "info");
      }
    } finally {
      setLoading(false);
    }
  };

  // Inicialización de la base de datos y Seguridad
  useEffect(() => {
    // 1. Mostrar caché INMEDIATAMENTE para sensación "flash"
    const cached = localStorage.getItem("sunat_data_v1");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setEmpresas(parsed);
        setFiltered(parsed);
      } catch (e) { console.error("Cache error", e); }
    }

    const startApp = async () => {
      setLoading(true);
      try {
        // 2. Init DB en background
        await initDatabase();
        // 3. Traer datos reales
        await fetchEmpresas();
      } catch (err) {
        console.error("Error al inicializar DB:", err);
        setError(`Error crítico: ${err.message || "No se pudo conectar con la base de datos."}`);
      } finally {
        setLoading(false);
      }
    };

    startApp();


    // 2. Bloquear F12 y Clic Derecho
    const handleKeyDown = (e) => {
      // Bloquear F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Bloquear Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
      }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Filtrar y ordenar empresas por último dígito del RUC (0-9)
  useEffect(() => {
    let result = empresas;
    if (searchText.trim()) {
      const q = searchText.toUpperCase().trim(); // Siempre buscar en mayusculas

      const isOnlyNumbers = /^\d+$/.test(q);

      result = result.filter(e => {
        if (isOnlyNumbers) {
          // Si es numero, buscar en cualquier parte del RUC (ej. buscar "20" encuentra todos los que empiezan o contienen 20)
          // También sirve para encontrar RUCs completos copiados y pegados.
          return e.RUC && e.RUC.includes(q);
        } else {
          // Si es texto, buscar siempre por coincidencia de Razón Social en mayúsculas
          return e.RazonSocial && e.RazonSocial.toUpperCase().includes(q);
        }
      }) || [];
    }
    if (sortByLastRuc && Array.isArray(result)) {
      // Ordenar por último dígito del RUC (0, 1, 2, ... 9)
      result = [...result].sort((a, b) => {
        const lastA = a.RUC ? parseInt(a.RUC.slice(-1)) || 0 : 10;
        const lastB = b.RUC ? parseInt(b.RUC.slice(-1)) || 0 : 10;
        return lastA - lastB;
      });
    }
    setFiltered(result || []);
  }, [searchText, empresas, sortByLastRuc]);

  function setStatusMsg(msg, type = "info") { setStatus(msg); setStatusType(type); }

  function handleOpenPortal(empresa, group = "SUNAT") {
    setSelectedId(empresa.Id);
    setPortalGroup(group);
    setPortalEmpresa(empresa);
  }

  async function handleLogin(empresa, browser, portal, group) {
    setLoginLoading(true);
    setPortalEmpresa(null);
    const targetPortal = group === "SUNAFIL" ? "SUNAFIL" : portal;
    const motor = empresa.Motor || "selenium";

    setStatusMsg(`Iniciando acceso a ${targetPortal} — ${empresa.RazonSocial}...`, "loading");

    try {
      // loginSunat signature: (empresaId, browser, engine, portal)
      const result = await loginSunat(empresa.Id, browser, motor, targetPortal);
      setStatusMsg(result.message || `Portal ${targetPortal} abierto.`, "success");
    } catch (err) {
      console.error(err);
      setStatusMsg(`Error al iniciar: ${err.message}`, "error");
    } finally {
      setLoginLoading(false);
    }
  }

  const handleBackup = async () => {
    try {
      const confirmBackup = await ask(
        "¿Estás seguro que deseas generar una copia de seguridad de la base de datos y la clave maestra?",
        { title: "Generar Copia de Seguridad", kind: "info" }
      );

      if (!confirmBackup) return;

      const dateStr = new Date().toISOString().split('T')[0];
      const selectedPath = await save({
        filters: [{
          name: 'Copia de Seguridad (ZIP)',
          extensions: ['zip']
        }],
        defaultPath: `Backup-Sunat-${dateStr}.zip`
      });

      if (selectedPath) {
        setLoading(true);
        setStatusMsg("Creando copia de seguridad...", "info");
        const msg = await invoke("export_backup", { destPath: selectedPath });
        setStatusMsg(msg, "success");
        await tauriMessage(`Copia de seguridad guardada exitosamente en:\n\n${selectedPath}`, { title: "Backup Completado", kind: "info" });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg(`Error al crear backup: ${err}`, "error");
      await tauriMessage(`Ocurrió un error al intentar crear la copia de seguridad:\n\n${err}`, { title: "Error de Backup", kind: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      const selectedPath = await open({
        filters: [{
          name: 'Copia de Seguridad (ZIP)',
          extensions: ['zip']
        }],
        multiple: false,
        title: "Seleccionar Copia de Seguridad para Restaurar"
      });

      if (!selectedPath) return;

      const confirmRestore = await ask(
        "¡ADVERTENCIA CRÍTICA!\n\nAl restaurar esta copia de seguridad, toda la información de empresas y claves actuales será ELIMINADA y reemplazada permanentemente por los datos del archivo ZIP.\n\n¿Estás absolutamente seguro de querer continuar?",
        { title: "Peligro: Sobrescribir Datos", kind: "warning" }
      );

      if (!confirmRestore) return;

      setLoading(true);
      setStatusMsg("Restaurando base de datos...", "info");

      const msg = await invoke("import_backup", { srcPath: selectedPath });
      setStatusMsg(msg, "success");

      await tauriMessage(`Restauración completada con éxito.\n\nLa aplicación recargará los datos ahora.`, { title: "Restauración Exitosa", kind: "info" });

      // Reload the data from the newly restored database
      fetchEmpresas();

    } catch (err) {
      console.error(err);
      setStatusMsg(`Error crítico al restaurar: ${err}`, "error");
      await tauriMessage(`Ocurrió un error al intentar restaurar la copia de seguridad:\n\n${err}`, { title: "Error de Restauración", kind: "error" });
    } finally {
      setLoading(false);
    }
  };

  async function handleDeleteConfirmed() {
    if (!confirmDelete) return;
    try {
      const result = await deleteEmpresa(confirmDelete.id);
      setStatusMsg(result.message, "success");
      fetchEmpresas();
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`, "error");
    }
    setConfirmDelete(null);
  }

  function handleAdd() { setEditingEmpresa(null); setShowForm(true); }
  function handleEdit(empresa) { setConfirmEdit(empresa); }
  function handleEditConfirmed() { setEditingEmpresa(confirmEdit); setShowForm(true); setConfirmEdit(null); }

  return (
    <div className="app-layout">
      {/* Contenido principal ocupando todo el ancho */}
      <div className="main-panel" style={{ marginLeft: 0, width: '100%' }}>
        <div className="main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="https://images.seeklogo.com/logo-png/40/1/superintendencia-nacional-de-atencion-tributaria-logo-png_seeklogo-402619.png"
              alt="Logo SUNAT"
              className="detailLogoImage"
              style={{ height: '28px', width: 'auto' }}
            />
            Automatizacion-SOL
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="tooltip-wrapper" data-tooltip="Restaurar Backup (.zip)">
              <button
                className="btn btn-backup"
                onClick={handleRestore}
                style={{ borderRadius: '50%', padding: '6px', display: 'flex' }}
              >
                <IconUpload width={16} height={16} />
              </button>
            </div>
            <div className="tooltip-wrapper" data-tooltip="Generar Backup (.zip)">
              <button
                className="btn btn-backup"
                onClick={handleBackup}
                style={{ borderRadius: '50%', padding: '6px', display: 'flex' }}
              >
                <IconDownload width={16} height={16} />
              </button>
            </div>

            <div className="tooltip-wrapper" data-tooltip={theme === "dark" ? "Cambiar a Claro" : "Cambiar a Oscuro"}>
              <button
                className="btn btn-theme"
                onClick={toggleTheme}
                style={{ borderRadius: '50%', display: 'flex' }}
              >
                {theme === "dark" ? <IconSun width={16} height={16} /> : <IconMoon width={16} height={16} />}
              </button>
            </div>

            {updateAvailable && (
              <div className="tooltip-wrapper" data-tooltip="Actualización disponible">
                <button
                  className="btn"
                  onClick={handleManualUpdate}
                  style={{
                    borderRadius: '50%',
                    display: 'flex',
                    background: updateAvailable ? 'var(--accent-color)' : 'transparent',
                    color: updateAvailable ? 'white' : 'inherit',
                    padding: '6px',
                    animation: updateAvailable ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  <IconUpdate width={16} height={16} />
                </button>
              </div>
            )}

            {!updateAvailable && (
              <div className="tooltip-wrapper" data-tooltip="Buscar actualizaciones">
                <button
                  className="btn"
                  onClick={handleManualUpdate}
                  style={{
                    borderRadius: '50%',
                    display: 'flex',
                    padding: '6px'
                  }}
                >
                  <IconUpdate width={16} height={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <div className="status-pill status-error" style={{ marginBottom: '16px', display: 'block' }}>{error}</div>}

        <Toolbar
          onAdd={handleAdd}
          onRefresh={fetchEmpresas}
          loading={loading}
          sortByLastRuc={sortByLastRuc}
          onSortByLastRuc={() => setSortByLastRuc(!sortByLastRuc)}
          searchText={searchText}
          onSearchChange={setSearchText}
        />

        <div className="cards-container">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>No hay empresas registradas</p>
              <p className="empty-hint">Haga clic en "+ Nueva Empresa" para agregar una</p>
            </div>
          ) : (
            filtered.map((emp, idx) => {
              const lastDigit = emp.RUC ? emp.RUC.slice(-1) : "-";
              const prevDigit = idx > 0 ? (filtered[idx - 1].RUC ? filtered[idx - 1].RUC.slice(-1) : "-") : null;
              const showHeader = sortByLastRuc && (lastDigit !== prevDigit);

              return (
                <Fragment key={emp.Id}>
                  {showHeader && (
                    <div className="group-header">
                      Dígito {lastDigit}
                    </div>
                  )}
                  <EmpresaCard
                    empresa={emp}
                    index={idx + 1}
                    isSelected={selectedId === emp.Id}
                    isLogging={loginLoading && selectedId === emp.Id}
                    onSelect={() => setSelectedId(emp.Id)}
                    onLogin={() => handleOpenPortal(emp, "SUNAT")}
                    onSunafil={() => handleOpenPortal(emp, "SUNAFIL")}
                    onEdit={() => handleEdit(emp)}
                    onDelete={() => setConfirmDelete({ id: emp.Id, nombre: emp.RazonSocial })}
                  />
                </Fragment>
              );
            })
          )}
        </div>

        <div className="main-footer">
          <span>Total: {empresas.length} &nbsp; Activos: {empresas.length}</span>
          {status && (
            <span className={`status-pill status-${statusType}`}>
              {status}
              <button className="status-close" onClick={() => setStatus("")}>×</button>
            </span>
          )}
        </div>
      </div>

      {/* Modales */}
      {showForm && (
        <EmpresaForm
          empresa={editingEmpresa}
          onClose={() => { setShowForm(false); setEditingEmpresa(null); }}
          onSaved={() => { setShowForm(false); setEditingEmpresa(null); fetchEmpresas(); }}
          setStatus={setStatusMsg}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          type="delete"
          nombre={confirmDelete.nombre}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmEdit && (
        <ConfirmDialog
          type="edit"
          nombre={confirmEdit.RazonSocial}
          onConfirm={handleEditConfirmed}
          onCancel={() => setConfirmEdit(null)}
        />
      )}

      {portalEmpresa && (
        <PortalSelector
          empresa={portalEmpresa}
          group={portalGroup}
          onLogin={handleLogin}
          onClose={() => setPortalEmpresa(null)}
        />
      )}
    </div>
  );
}
