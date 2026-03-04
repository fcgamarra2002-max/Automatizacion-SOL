/**
 * Iconos SVG — Fluent UI System Icons (Windows 11).
 * Basados en microsoft/fluentui-system-icons (Regular 20px).
 * Líneas limpias de 1.5px stroke, estilo outline.
 */

// Escudo / Logo SUNAT
export function IconShield(props) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 3L4 7v5c0 5.25 3.44 10.16 8 11.5 4.56-1.34 8-6.25 8-11.5V7l-8-4z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    );
}

// Agregar / Nuevo
export function IconAdd(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
            <line x1="8" y1="3" x2="8" y2="13" />
            <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
    );
}

// Cohete / Lanzar
export function IconRocket(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M8 1.5c0 0 3 2.5 3 6.5 0 1.5-.5 2.8-1.2 3.8l.7 2.7H5.5l.7-2.7C5.5 10.8 5 9.5 5 8c0-4 3-6.5 3-6.5z" />
            <circle cx="8" cy="7.5" r="1.5" />
        </svg>
    );
}

// Lista / Tabla
export function IconList(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
            <line x1="5" y1="4" x2="13" y2="4" />
            <line x1="5" y1="8" x2="13" y2="8" />
            <line x1="5" y1="12" x2="13" y2="12" />
            <circle cx="2.5" cy="4" r="0.75" fill="currentColor" stroke="none" />
            <circle cx="2.5" cy="8" r="0.75" fill="currentColor" stroke="none" />
            <circle cx="2.5" cy="12" r="0.75" fill="currentColor" stroke="none" />
        </svg>
    );
}

// Globo / Navegador
export function IconGlobe(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="8" cy="8" r="6.5" />
            <path d="M1.5 8h13" />
            <path d="M8 1.5c-2 2-3 4-3 6.5s1 4.5 3 6.5" />
            <path d="M8 1.5c2 2 3 4 3 6.5s-1 4.5-3 6.5" />
        </svg>
    );
}

// Engranaje / Configuración
export function IconSettings(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="8" cy="8" r="2.5" />
            <path d="M6.8 1.5h2.4l.3 1.8c.4.1.7.3 1 .5l1.7-.7 1.2 2.1-1.4 1.1c0 .2.05.5.05.7s0 .5-.05.7l1.4 1.1-1.2 2.1-1.7-.7c-.3.2-.6.4-1 .5l-.3 1.8H6.8l-.3-1.8c-.4-.1-.7-.3-1-.5l-1.7.7-1.2-2.1 1.4-1.1c0-.2-.05-.5-.05-.7s0-.5.05-.7l-1.4-1.1 1.2-2.1 1.7.7c.3-.2.6-.4 1-.5l.3-1.8z" />
        </svg>
    );
}

// Editar / Lápiz
export function IconEdit(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M11.5 1.5l3 3L5 14H2v-3l9.5-9.5z" />
            <line x1="9.5" y1="3.5" x2="12.5" y2="6.5" />
        </svg>
    );
}

// Eliminar / Papelera
export function IconDelete(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2.5 4.5h11" />
            <path d="M5.5 4.5V3a1 1 0 011-1h3a1 1 0 011 1v1.5" />
            <path d="M3.5 4.5l.7 9.1a1 1 0 001 .9h5.6a1 1 0 001-.9l.7-9.1" />
            <line x1="6.5" y1="7" x2="6.5" y2="12" />
            <line x1="9.5" y1="7" x2="9.5" y2="12" />
        </svg>
    );
}

// Refrescar / Actualizar
export function IconRefresh(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2.5 8a5.5 5.5 0 019.21-4.06" />
            <polyline points="12.5 1 12.5 4.5 9 4.5" />
            <path d="M13.5 8a5.5 5.5 0 01-9.21 4.06" />
            <polyline points="3.5 15 3.5 11.5 7 11.5" />
        </svg>
    );
}

// Cerrar / X
export function IconClose(props) {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
            <line x1="2" y1="2" x2="10" y2="10" />
            <line x1="10" y1="2" x2="2" y2="10" />
        </svg>
    );
}

// Guardar / Disco
export function IconSave(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M13 14.5H3a1.5 1.5 0 01-1.5-1.5V3A1.5 1.5 0 013 1.5h7.38a1.5 1.5 0 011.06.44l2.12 2.12a1.5 1.5 0 01.44 1.06V13a1.5 1.5 0 01-1.5 1.5z" />
            <rect x="5" y="1.5" width="6" height="4" rx=".5" />
            <rect x="4.5" y="9" width="7" height="5.5" rx=".5" />
        </svg>
    );
}

// Sol / Tema claro
export function IconSun(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
            <circle cx="8" cy="8" r="3" />
            <line x1="8" y1="1" x2="8" y2="2.5" />
            <line x1="8" y1="13.5" x2="8" y2="15" />
            <line x1="1" y1="8" x2="2.5" y2="8" />
            <line x1="13.5" y1="8" x2="15" y2="8" />
            <line x1="3.05" y1="3.05" x2="4.11" y2="4.11" />
            <line x1="11.89" y1="11.89" x2="12.95" y2="12.95" />
            <line x1="3.05" y1="12.95" x2="4.11" y2="11.89" />
            <line x1="11.89" y1="4.11" x2="12.95" y2="3.05" />
        </svg>
    );
}

// Luna / Tema oscuro
export function IconMoon(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M14 9.5A6.5 6.5 0 016.5 2 6.5 6.5 0 1014 9.5z" />
        </svg>
    );
}

// SUNAFIL / Inspección
export function IconSunafil(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2 14.5h12" />
            <path d="M3 14.5V3.5a1 1 0 011-1h8a1 1 0 011 1v11" />
            <path d="M5.5 5h1" />
            <path d="M9.5 5h1" />
            <path d="M5.5 8h1" />
            <path d="M9.5 8h1" />
            <path d="M5.5 11h1" />
            <path d="M9.5 11h1" />
        </svg>
    );
}

// Mis Declaraciones y Pagos
export function IconDocumentMoney(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 2.5v11a1 1 0 001 1h8a1 1 0 001-1V5l-4-2.5H4a1 1 0 00-1 1z" />
            <path d="M10 9.5h3a1 1 0 011 1v1a1 1 0 01-1 1h-3" />
            <path d="M6 8v4" />
            <path d="M9 10v2" />
        </svg>
    );
}

// Trámites y Consultas
export function IconClipboardSearch(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M10 1.5h3.5a1 1 0 011 1V5l-1.5 8H4L2.5 5V2.5a1 1 0 011-1H6" />
            <path d="M6 9.5h4" />
            <circle cx="10.5" cy="12.5" r="2" />
            <path d="M12 14l-1.5-1.5" />
        </svg>
    );
}

// Portal / Oficina
export function IconOffice(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="2" y="3" width="12" height="10" rx="1" />
            <path d="M5 7h6" />
            <path d="M5 10h6" />
            <circle cx="8" cy="5.5" r="0.5" fill="currentColor" />
        </svg>
    );
}

// Ordenar / Sort
export function IconSort(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2 4h12" />
            <path d="M5 7l3 3 3-3" />
            <path d="M2 13h12" />
            <path d="M5 10l3-3 3 3" />
        </svg>
    );
}

// Backup: Base de Datos + Flecha Abajo o Salir
export function IconDownload(props) {
    return (
        <svg version="1.1" width="16" height="16" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" {...props}>
            <rect className="clr-i-outline clr-i-outline-path-1" x="6" y="22" width="24" height="2" fill="currentColor"></rect>
            <path className="clr-i-outline clr-i-outline-path-2" d="M30.84,13.37A1.94,1.94,0,0,0,28.93,12H26.55a3,3,0,0,1-.14,2h2.54C30,16.94,31.72,21.65,32,22.48V30H4V22.48C4.28,21.65,7.05,14,7.05,14H9.58a3,3,0,0,1-.14-2H7.07a1.92,1.92,0,0,0-1.9,1.32C2,22,2,22.1,2,22.33V30a2,2,0,0,0,2,2H32a2,2,0,0,0,2-2V22.33C34,22.1,34,22,30.84,13.37Z" fill="currentColor"></path>
            <path className="clr-i-outline clr-i-outline-path-3" d="M18,19.84l6.38-6.35A1,1,0,1,0,23,12.08L19,16V4a1,1,0,1,0-2,0V16l-4-3.95a1,1,0,0,0-1.41,1.42Z" fill="currentColor"></path>
        </svg>
    );
}

// Restore: Base de Datos + Flecha Arriba o Entrar
export function IconUpload(props) {
    return (
        <svg version="1.1" width="16" height="16" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" {...props}>
            <rect className="clr-i-outline clr-i-outline-path-1" x="6" y="22" width="24" height="2" fill="currentColor"></rect>
            <rect className="clr-i-outline clr-i-outline-path-2" x="26" y="26" width="4" height="2" fill="currentColor"></rect>
            <path className="clr-i-outline clr-i-outline-path-3" d="M13,9.92,17,6V19a1,1,0,1,0,2,0V6l4,3.95A1,1,0,1,0,24.38,8.5L18,2.16,11.61,8.5A1,1,0,0,0,13,9.92Z" fill="currentColor"></path>
            <path className="clr-i-outline clr-i-outline-path-4" d="M30.84,13.37A1.94,1.94,0,0,0,28.93,12H21v2h7.95C30,16.94,31.72,21.65,32,22.48V30H4V22.48C4.28,21.65,7.05,14,7.05,14H15V12H7.07a1.92,1.92,0,0,0-1.9,1.32C2,22,2,22.1,2,22.33V30a2,2,0,0,0,2,2H32a2,2,0,0,0,2-2V22.33C34,22.1,34,22,30.84,13.37Z" fill="currentColor"></path>
        </svg>
    );
}

// Persona Natural
export function IconPerson(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

// Persona Jurídica / Empresa
export function IconCompany(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M12 6h.01" />
            <path d="M12 10h.01" />
            <path d="M12 14h.01" />
            <path d="M16 10h.01" />
            <path d="M16 14h.01" />
            <path d="M8 10h.01" />
            <path d="M8 14h.01" />
        </svg>
    );
}

// Actualización disponible
export function IconUpdate(props) {
    return (
        <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" />
            <path d="M50 20V60M35 45L50 60L65 45" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M30 75H70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
    );
}
