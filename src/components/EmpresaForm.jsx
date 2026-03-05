/**
 * EmpresaForm — Formulario de registro/edición de empresas
 * Estilo SUNAT "Operaciones en Línea"
 * Reescrito desde cero para máxima robustez
 */

import { useState, useEffect, useRef } from "react";
import { addEmpresa, updateEmpresa, consultarRuc } from "../services/tauriService";

const INITIAL = { RUC: "", RazonSocial: "", UsuarioSOL: "", ClaveSOL: "", Estado: "Activo" };

/* ── Estilos embebidos ── */
const S = {

  modal: {
    background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)", width: 520, maxWidth: "94vw",
    boxShadow: "var(--shadow-lg)", overflow: "hidden",
    fontFamily: "var(--font-family)", border: "1px solid var(--border)",
  },
  header: {
    background: "var(--accent)", color: "var(--text-on-accent)", padding: "14px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  headerTitle: { margin: 0, fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-family)" },
  closeBtn: {
    background: "none", border: "none", color: "var(--text-on-accent)", fontSize: "1.4rem",
    cursor: "pointer", lineHeight: 1, padding: 0, opacity: 0.8,
  },
  body: { padding: "24px 28px", background: "var(--bg-elevated)" },
  field: { marginBottom: 18 },
  label: {
    display: "block", fontSize: ".85rem", fontWeight: 700,
    color: "var(--text-secondary)", marginBottom: 6, fontFamily: "var(--font-family)",
  },
  input: (hasError) => ({
    width: "100%", padding: "10px 14px", fontSize: "1.1rem",
    border: `1px solid ${hasError ? "var(--error)" : "var(--border-input)"}`,
    borderRadius: "var(--radius-sm)",
    outline: "none", boxSizing: "border-box", transition: "all .2s",
    background: "var(--bg-input)", color: "var(--text)", fontFamily: "var(--font-family)",
  }),
  inputFocus: { borderColor: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-subtle)" },
  rucRow: { display: "flex", gap: 8 },
  rucInput: (hasError) => ({
    flex: 1, padding: "10px 14px", fontSize: "1.1rem",
    border: `1px solid ${hasError ? "var(--error)" : "var(--border-input)"}`,
    borderRadius: "var(--radius-sm)",
    outline: "none", boxSizing: "border-box", background: "var(--bg-input)",
    color: "var(--text)", fontFamily: "var(--font-family)",
  }),
  searchBtn: (disabled) => ({
    width: 60, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
    background: disabled ? "var(--bg-hover)" : "var(--accent)", border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer", color: disabled ? "var(--text-muted)" : "var(--text-on-accent)",
    transition: "all .2s",
  }),
  error: { color: "var(--error)", fontSize: ".8rem", marginTop: 4, fontFamily: "var(--font-family)" },
  statusBar: (type) => ({
    padding: "10px 16px", borderRadius: "var(--radius-sm)", marginBottom: 16, fontSize: ".9rem",
    display: "flex", alignItems: "center", gap: 8,
    background: type === "success" ? "var(--success-bg)" : type === "error" ? "var(--error-bg)" : "var(--info-bg)",
    color: type === "success" ? "var(--success)" : type === "error" ? "var(--error)" : "var(--info)",
    border: `1px solid ${type === "success" ? "var(--success)" : type === "error" ? "var(--error)" : "var(--info)"}`,
    opacity: 0.9,
  }),
  footer: {
    display: "flex", justifyContent: "flex-end", gap: 12,
    padding: "16px 28px", borderTop: "1px solid var(--border)", background: "var(--bg)",
  },
  btnCancel: {
    padding: "10px 24px", fontSize: ".95rem", background: "transparent",
    border: "1px solid var(--border-input)", borderRadius: "var(--radius-sm)",
    cursor: "pointer", color: "var(--text-secondary)",
    fontFamily: "var(--font-family)", transition: "all .2s",
  },
  btnSave: (disabled) => ({
    padding: "10px 32px", fontSize: ".95rem", fontWeight: 700,
    background: disabled ? "var(--bg-hover)" : "var(--accent)", color: "var(--text-on-accent)",
    border: "none", borderRadius: "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s",
    fontFamily: "var(--font-family)",
  }),
  spinner: {
    width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)",
    borderTop: "2.5px solid var(--text-on-accent)", borderRadius: "50%",
    animation: "spin .7s linear infinite",
  },
  spinnerDark: {
    width: 16, height: 16, border: "2px solid var(--border-input)",
    borderTop: "2px solid var(--accent)", borderRadius: "50%",
    animation: "spin .7s linear infinite", display: "inline-block",
  },
};

/* ── Iconos SVG ── */
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/* ── Keyframes (inyectados una sola vez) ── */
if (typeof document !== "undefined" && !document.getElementById("empresa-form-keyframes")) {
  const style = document.createElement("style");
  style.id = "empresa-form-keyframes";
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

/* ════════════════════════════════════════ */
export default function EmpresaForm({ empresa, onClose, onSaved, setStatus }) {
  const isEdit = !!empresa;
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null); // { text, type }
  const debounceRef = useRef(null);
  const usuarioSolRef = useRef(null);

  useEffect(() => {
    if (empresa) setForm({ ...empresa, ClaveSOL: empresa.ClaveSOL || "" });
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [empresa]);

  /* ── Helpers ── */
  function showMsg(text, type = "info") {
    if (!text) { setMsg(null); return; }
    setMsg({ text, type });
    if (setStatus) setStatus(text, type);
  }

  function clearField(name) {
    setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  }

  /* ── Cambios en inputs ── */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearField(name);

    // Auto-consultar al completar 11 dígitos
    if (name === "RUC") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const digits = value.replace(/\D/g, "");
      if (digits.length === 11) {
        debounceRef.current = setTimeout(() => buscarRuc(digits), 400);
      }
    }
  }

  /* ── Consultar RUC (API) ── */
  async function buscarRuc(rucStr) {
    const ruc = (rucStr || form.RUC).trim();
    if (!/^\d{11}$/.test(ruc)) {
      setErrors((p) => ({ ...p, RUC: "RUC debe tener 11 dígitos" }));
      return;
    }

    setSearching(true);
    showMsg("Consultando SUNAT…", "loading");

    try {
      const res = await consultarRuc(ruc);
      console.log("Resultado RUC:", res);

      if (res.success) {
        const nombre = res.RazonSocial || res.razon_social || "";
        setForm((p) => ({
          ...p,
          RUC: ruc,
          RazonSocial: nombre || p.RazonSocial,
          Estado: res.estado || res.Estado || p.Estado || "Activo",
        }));
        showMsg(null);
        clearField("RUC");
        // Enfocar usuario SOL si es nuevo
        if (!isEdit && usuarioSolRef.current) {
          setTimeout(() => usuarioSolRef.current.focus(), 100);
        }
      } else {
        showMsg(res.message || "RUC no encontrado", "error");
      }
    } catch (err) {
      console.error("Error RUC:", err);
      showMsg(`Error: ${err.message}`, "error");
    } finally {
      setSearching(false);
    }
  }

  /* ── Validación antes de guardar ── */
  function validate() {
    const e = {};
    if (!/^\d{11}$/.test(form.RUC)) e.RUC = "RUC inválido (11 dígitos)";
    if (!form.RazonSocial.trim()) e.RazonSocial = "Obligatorio";
    if (!form.UsuarioSOL.trim()) e.UsuarioSOL = "Obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Guardar ── */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = isEdit
        ? await updateEmpresa(empresa.Id, form)
        : await addEmpresa(form);
      showMsg(res.message || "Guardado", "success");
      onSaved();
    } catch (err) {
      showMsg(`Error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  /* ── Render ── */
  const canSearch = form.RUC.replace(/\D/g, "").length === 11 && !searching;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>

        {/* ─── Header ─── */}
        <div style={S.header}>
          <h2 style={S.headerTitle}>
            {isEdit ? "Editar Empresa" : "Nueva Empresa"}
          </h2>
          <button style={S.closeBtn} onClick={onClose} title="Cerrar">×</button>
        </div>

        {/* ─── Body ─── */}
        <form onSubmit={handleSubmit}>
          <div style={S.body}>

            {/* Status */}
            {msg && (
              <div style={S.statusBar(msg.type)}>
                {msg.type === "loading" && <div style={S.spinnerDark} />}
                <span>{msg.text}</span>
              </div>
            )}

            {/* RUC + Lupa */}
            <div style={S.field}>
              <label style={S.label}>RUC</label>
              <div style={S.rucRow}>
                <input
                  style={S.rucInput(!!errors.RUC)}
                  type="text" name="RUC" value={form.RUC}
                  onChange={handleChange} maxLength={11}
                  placeholder="Ingrese RUC (11 dígitos)"
                  autoComplete="off"
                />
                <button
                  type="button"
                  style={S.searchBtn(!canSearch)}
                  disabled={!canSearch}
                  onClick={() => buscarRuc()}
                  title="Buscar RUC"
                >
                  {searching ? <div style={S.spinner} /> : <SearchIcon />}
                </button>
              </div>
              {errors.RUC && <div style={S.error}>{errors.RUC}</div>}
            </div>

            {/* Razón Social */}
            <div style={S.field}>
              <label style={S.label}>Razón Social</label>
              <input
                style={S.input(!!errors.RazonSocial)}
                type="text" name="RazonSocial" value={form.RazonSocial}
                onChange={handleChange} placeholder="Se autocompleta al validar RUC"
              />
              {errors.RazonSocial && <div style={S.error}>{errors.RazonSocial}</div>}
            </div>

            {/* Usuario SOL */}
            <div style={S.field}>
              <label style={S.label}>Usuario SOL</label>
              <input
                style={S.input(!!errors.UsuarioSOL)}
                type="text" name="UsuarioSOL" value={form.UsuarioSOL}
                onChange={handleChange} maxLength={20}
                placeholder="Ingrese usuario SOL"
                autoComplete="off"
                ref={usuarioSolRef}
              />
              {errors.UsuarioSOL && <div style={S.error}>{errors.UsuarioSOL}</div>}
            </div>

            {/* Clave SOL */}
            <div style={S.field}>
              <label style={S.label}>Clave SOL</label>
              <input
                style={S.input(false)}
                type="text" name="ClaveSOL" value={form.ClaveSOL}
                onChange={handleChange}
                placeholder={isEdit ? "Vacío = sin cambios" : "Ingrese clave SOL"}
                autoComplete="off"
              />
            </div>
          </div>

          {/* ─── Footer ─── */}
          <div style={S.footer}>
            <button type="button" style={S.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" style={S.btnSave(saving)} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
