/**
 * Sidebar — Navegación estilo SUNAT Smart Access
 */

import { IconShield, IconSettings, IconSun, IconMoon } from "./Icons";

export default function Sidebar({ searchText, onSearchChange, theme, onToggleTheme }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-top">
                {/* Buscador sidebar */}
                <div className="sidebar-search">
                    <input
                        type="text"
                        placeholder="Buscar empresa..."
                        value={searchText}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="6" cy="6" r="4.5" />
                        <line x1="9.2" y1="9.2" x2="12.5" y2="12.5" />
                    </svg>
                </div>

                {/* Navegación */}
                <nav className="sidebar-nav">
                    <a className="nav-item active" href="#">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 8.5V14a1 1 0 001 1h10a1 1 0 001-1V8.5" />
                            <path d="M8 1L1 8h3v5h8V8h3L8 1z" />
                        </svg>
                        Empresas
                    </a>
                </nav>
            </div>

            <div className="sidebar-bottom">
                <div className="sidebar-brand">
                    <div className="brand-icon"><IconShield width={14} height={14} /></div>
                    <div>
                        <div className="brand-name">Automatizacion-SOL</div>
                        <div className="brand-version">v0.1.1</div>
                    </div>
                </div>
                <a className="nav-item" href="#" onClick={(e) => { e.preventDefault(); onToggleTheme(); }}>
                    {theme === "dark" ? <IconSun width={16} height={16} /> : <IconMoon width={16} height={16} />}
                    {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
                </a>
                <a className="nav-item" href="#" onClick={(e) => e.preventDefault()}>
                    <IconSettings width={16} height={16} />
                    Configuración
                </a>
            </div>
        </aside>
    );
}
