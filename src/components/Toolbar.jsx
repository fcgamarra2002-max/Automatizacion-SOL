/**
 * Toolbar — Barra de herramientas simplificada
 * El navegador/motor ahora se elige en el popup PortalSelector
 */

import { IconAdd, IconRefresh, IconSort } from "./Icons";

export default function Toolbar({ onAdd, onRefresh, loading, sortByLastRuc, onSortByLastRuc, searchText, onSearchChange }) {
    return (
        <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="toolbar-left" style={{ display: 'flex', gap: '8px' }}>
                <div className="tooltip-wrapper" data-tooltip="Refrescar">
                    <button className="btn btn-ghost" onClick={onRefresh} disabled={loading}>
                        <IconRefresh width={14} height={14} /> {loading ? "Cargando..." : "Refrescar"}
                    </button>
                </div>
                <div className="tooltip-wrapper" data-tooltip="Ordenar por último dígito del RUC">
                    <button
                        className={`btn btn-ghost ${sortByLastRuc ? "btn-active" : ""}`}
                        onClick={onSortByLastRuc}
                        style={{
                            opacity: sortByLastRuc ? 0.9 : 0.5,
                            fontSize: '0.85rem',
                            padding: '6px 10px',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = sortByLastRuc ? 1 : 0.7;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = sortByLastRuc ? 0.9 : 0.5;
                        }}
                    >
                        <IconSort width={14} height={14} /> Último RUC
                    </button>
                </div>
            </div>

            <div className="toolbar-center" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 20px' }}>
                <div className="search-container" style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <input
                        type="text"
                        placeholder="Buscar empresa..."
                        value={searchText}
                        onChange={(e) => onSearchChange(e.target.value.toUpperCase())}
                        style={{
                            padding: '10px 20px 10px 38px',
                            fontSize: '0.95rem',
                            borderRadius: '24px',
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-input)',
                            width: '100%',
                            boxSizing: 'border-box',
                            boxShadow: 'var(--shadow)',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-input)';
                            e.currentTarget.style.boxShadow = 'var(--shadow)';
                        }}
                    />
                    <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                        <circle cx="6" cy="6" r="4.5" />
                        <line x1="9.2" y1="9.2" x2="12.5" y2="12.5" />
                    </svg>
                </div>
            </div>

            <div className="toolbar-right">
                <button
                    className="btn"
                    onClick={onAdd}
                    style={{
                        backgroundColor: '#0067b8', /* SUNAT blue */
                        color: 'white',
                        padding: '10px 24px',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        borderRadius: '24px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0, 103, 184, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 103, 184, 0.4)';
                        e.currentTarget.style.backgroundColor = '#005a9e';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 103, 184, 0.3)';
                        e.currentTarget.style.backgroundColor = '#0067b8';
                    }}
                >
                    <IconAdd width={18} height={18} /> Nueva Empresa
                </button>
            </div>
        </div>
    );
}
