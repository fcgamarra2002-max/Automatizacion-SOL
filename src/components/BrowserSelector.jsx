/**
 * Selector navegador/motor — Iconos SVG, estilo Windows.
 */

import { IconGlobe, IconSettings } from "./Icons";

export default function BrowserSelector({ browser, engine, onBrowserChange, onEngineChange }) {
    return (
        <div className="browser-selector">
            <div className="selector-group">
                <label htmlFor="browser-select"><IconGlobe /> Navegador</label>
                <select id="browser-select" value={browser} onChange={(e) => onBrowserChange(e.target.value)} className="select-control">
                    <option value="chrome">Google Chrome</option>
                    <option value="edge">Microsoft Edge</option>
                    <option value="firefox">Mozilla Firefox</option>
                </select>
            </div>
            <div className="selector-group">
                <label htmlFor="engine-select"><IconSettings /> Motor</label>
                <select id="engine-select" value={engine} onChange={(e) => onEngineChange(e.target.value)} className="select-control">
                    <option value="selenium">Selenium</option>
                    <option value="playwright">Playwright</option>
                </select>
            </div>
        </div>
    );
}
