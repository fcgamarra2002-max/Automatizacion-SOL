/**
 * Diálogo de confirmación — Soporta acciones de Editar y Eliminar
 */

import { IconDelete, IconEdit } from "./Icons";

export default function ConfirmDialog({ nombre, type = "delete", onConfirm, onCancel }) {
    const isDelete = type === "delete";

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon" style={isDelete ? {} : { background: "var(--info-bg)", color: "var(--info)" }}>
                    {isDelete
                        ? <IconDelete width={40} height={40} />
                        : <IconEdit width={40} height={40} />
                    }
                </div>
                <h3>{isDelete ? "¿Eliminar empresa?" : "¿Editar empresa?"}</h3>
                <p className="confirm-text">
                    {isDelete
                        ? <>¿Está seguro de que desea eliminar <strong>{nombre}</strong>? Esta acción no se puede deshacer.</>
                        : <>¿Desea editar los datos de <strong>{nombre}</strong>?</>
                    }
                </p>
                <div className="confirm-actions">
                    <button className="btn btn-secondary" style={{ padding: "12px 24px", fontSize: "1.1rem", background: "#dc3545", color: "#fff", border: "none" }} onClick={onCancel}>Cancelar</button>
                    <button
                        className="btn btn-primary"
                        style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "12px 24px", fontSize: "1.1rem", fontWeight: 600, cursor: "pointer" }}
                        onClick={onConfirm}
                    >
                        {isDelete
                            ? <><IconDelete width={16} height={16} /> Eliminar</>
                            : <><IconEdit width={16} height={16} /> Editar</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
