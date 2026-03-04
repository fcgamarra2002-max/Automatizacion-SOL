/**
 * PortalSelector — Popup de selección de Portal + Navegador
 * Flujo: Portales SUNAT → elige portal → elige navegador → INGRESAR
 */

import { useState } from "react";
import { IconChrome, IconEdge, IconFirefox } from "./BrowserIcons";
import { IconDocumentMoney, IconClipboardSearch, IconSunafil, IconPerson, IconCompany } from "./Icons";

const PORTALES = {
    SUNAT: [
        { id: "DECLARACIONES", label: "Mis Declaraciones y Pagos", Icon: IconDocumentMoney },
        { id: "TRAMITES", label: "Trámites y Consultas", Icon: IconClipboardSearch },
        { id: "RENTA_PERSONAS", label: "Renta Anual Personas", Icon: IconPerson },
        { id: "RENTA_EMPRESAS", label: "Renta Anual Empresas", Icon: IconCompany },
    ],
    SUNAFIL: [
        { id: "SUNAFIL", label: "Portal SUNAFIL (Casilla)", Icon: IconSunafil },
    ]
};

const BROWSERS = [
    { id: "chrome", label: "Chrome", Icon: IconChrome, color: "#4285F4" },
    { id: "edge", label: "Edge", Icon: IconEdge, color: "#0078D4" },
    { id: "firefox", label: "Firefox", Icon: IconFirefox, color: "#FF7139" },
];

export default function PortalSelector({ empresa, group = "SUNAT", onLogin, onClose }) {
    const options = PORTALES[group] || PORTALES.SUNAT;
    const [portal, setPortal] = useState(options[0].id);
    const [browser, setBrowser] = useState("chrome");
    const [loading, setLoading] = useState(false);

    async function handleIngresar() {
        setLoading(true);
        try {
            await onLogin(empresa, browser, portal, group);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="portal-popup" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="portal-header">
                    <span className="portal-title">Seleccionar Portal — {group}</span>
                    <span className="portal-empresa">{empresa.RazonSocial}</span>
                    <button className="portal-close" onClick={onClose}>✕</button>
                </div>

                {/* Sección Portal */}
                <div className="portal-body">
                    <div className="portal-section">
                        <span className="section-label">PORTAL</span>
                        <div className="portal-options">
                            {options.map((p) => (
                                <button
                                    key={p.id}
                                    className={`portal-option ${portal === p.id ? "active" : ""}`}
                                    onClick={() => setPortal(p.id)}
                                >
                                    <span className="portal-opt-icon"><p.Icon width={24} height={24} /></span>
                                    <span>{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="portal-divider"></div>

                    {/* Sección Navegador */}
                    <div className="portal-section">
                        <span className="section-label">NAVEGADOR</span>
                        <div className="browser-options">
                            {BROWSERS.map((b) => (
                                <button
                                    key={b.id}
                                    className={`browser-option ${browser === b.id ? "active" : ""}`}
                                    onClick={() => setBrowser(b.id)}
                                >
                                    <b.Icon size={32} />
                                    <span>{b.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Botón Ingresar */}
                <div className="portal-footer">
                    <button
                        className="btn-ingresar"
                        onClick={handleIngresar}
                        disabled={loading}
                    >
                        {loading ? "INGRESANDO..." : "INGRESAR A SUNAT"}
                    </button>
                </div>
            </div>
        </div>
    );
}
