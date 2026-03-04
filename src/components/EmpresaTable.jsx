/**
 * Tabla de empresas — Con confirmación de eliminación personalizada.
 */

import { useState } from "react";
import { deleteEmpresa } from "../services/tauriService";
import { IconEdit, IconDelete, IconClose } from "./Icons";

export default function EmpresaTable({
    empresas, selectedId, onSelect, onRefresh, onEdit, setStatus,
}) {
    const [deleting, setDeleting] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // {id, nombre}

    async function handleDelete() {
        if (!confirmDelete) return;
        setDeleting(confirmDelete.id);
        setConfirmDelete(null);
        try {
            const result = await deleteEmpresa(confirmDelete.id);
            setStatus(`${result.message}`, "success");
            onRefresh();
        } catch (err) {
            setStatus(`Error eliminando: ${err.message}`, "error");
        } finally {
            setDeleting(null);
        }
    }

    if (empresas.length === 0) {
        return (
            <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="empty-svg">
                    <rect x="6" y="8" width="36" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
                    <line x1="6" y1="16" x2="42" y2="16" stroke="currentColor" strokeWidth="2" />
                    <line x1="18" y1="16" x2="18" y2="40" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="1" />
                    <line x1="6" y1="32" x2="42" y2="32" stroke="currentColor" strokeWidth="1" />
                </svg>
                <p>No hay empresas registradas</p>
                <p className="empty-hint">Haga clic en "Nueva Empresa" para agregar una</p>
            </div>
        );
    }

    return (
        <>
            <div className="table-wrapper">
                <table className="empresa-table">
                    <thead>
                        <tr>
                            <th className="col-select"></th>
                            <th className="col-ruc">RUC</th>
                            <th className="col-razon">Razón Social</th>
                            <th className="col-actions">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {empresas.map((emp) => (
                            <tr
                                key={emp.Id}
                                className={`table-row ${selectedId === emp.Id ? "selected" : ""}`}
                                onClick={() => onSelect(emp.Id)}
                            >
                                <td className="col-select">
                                    <input
                                        type="radio" name="empresa"
                                        checked={selectedId === emp.Id}
                                        onChange={() => onSelect(emp.Id)}
                                        className="radio-input"
                                    />
                                </td>
                                <td className="col-ruc mono">{emp.RUC}</td>
                                <td className="col-razon">{emp.RazonSocial}</td>
                                <td className="col-actions">
                                    <button
                                        className="btn-icon btn-edit"
                                        onClick={(e) => { e.stopPropagation(); onEdit(emp); }}
                                        title="Editar"
                                    >
                                        <IconEdit />
                                    </button>
                                    <button
                                        className="btn-icon btn-delete"
                                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: emp.Id, nombre: emp.RazonSocial }); }}
                                        disabled={deleting === emp.Id}
                                        title="Eliminar"
                                    >
                                        <IconDelete />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de confirmación personalizado */}
            {confirmDelete && (
                <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-icon">
                            <IconDelete width={24} height={24} />
                        </div>
                        <h3>¿Eliminar empresa?</h3>
                        <p className="confirm-text">{confirmDelete.nombre}</p>
                        <div className="confirm-actions">
                            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                                Cancelar
                            </button>
                            <button className="btn btn-danger" onClick={handleDelete}>
                                <IconDelete width={13} height={13} /> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
