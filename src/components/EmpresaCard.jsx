/**
 * Card de empresa — Estilo SUNAT Smart Access
 * Muestra: último dígito RUC, razón social, RUC completo, usuario, estado, acciones
 */

import { IconEdit, IconDelete, IconRefresh, IconSunafil, IconGlobe } from "./Icons";

export default function EmpresaCard({
    empresa, index, isSelected, isLogging,
    onSelect, onLogin, onSunafil, onEdit, onDelete,
}) {
    // Obtener último dígito del RUC para mostrar como índice
    const lastDigit = empresa.RUC ? empresa.RUC.slice(-1) : "-";

    return (
        <div
            className={`empresa-card ${isSelected ? "selected" : ""}`}
            onClick={onSelect}
        >
            {/* Último dígito del RUC como índice */}
            <div className="card-index">
                <span className="index-badge">{lastDigit}</span>
            </div>

            {/* Info */}
            <div className="card-info">
                <div className="card-name" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 400, fontSize: '14px', color: 'var(--text)' }}>{empresa.RUC || "Sin RUC"}</span>
                    <span style={{ fontWeight: 400, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{empresa.RazonSocial || "Sin Razón Social"}</span>
                </div>
            </div>

            {/* Portales + Acciones */}
            <div className="card-right">
                <div className="card-portals">
                    <div className="tooltip-wrapper tooltip-right" data-tooltip="Ingresar a Portales SUNAT">
                        <button
                            className={`btn-portal btn-sunat ${isLogging ? "loading" : ""}`}
                            onClick={(e) => { e.stopPropagation(); onLogin(); }}
                            disabled={isLogging}
                        >
                            <IconGlobe width={12} height={12} />
                            {isLogging ? "..." : "Portales SUNAT"}
                        </button>
                    </div>
                    <div className="tooltip-wrapper tooltip-right" data-tooltip="Ingresar a SUNAFIL">
                        <button
                            className="btn-portal btn-sunafil"
                            onClick={(e) => { e.stopPropagation(); onSunafil && onSunafil(); }}
                        >
                            <IconSunafil width={12} height={12} />
                            SUNAFIL
                        </button>
                    </div>
                </div>
                <div className="card-actions">
                    <div className="tooltip-wrapper tooltip-right" data-tooltip="Editar">
                        <button className="btn-icon btn-edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                            <IconEdit />
                        </button>
                    </div>
                    <div className="tooltip-wrapper tooltip-right" data-tooltip="Recargar Datos">
                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onLogin(); }} disabled={isLogging}>
                            <IconRefresh />
                        </button>
                    </div>
                    <div className="tooltip-wrapper tooltip-right" data-tooltip="Eliminar Empresa">
                        <button className="btn-icon btn-delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                            <IconDelete />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
