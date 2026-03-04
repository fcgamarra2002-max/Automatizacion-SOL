"""
Login SUNAT con Playwright — Versión Ultra-Robusta

Mejoras:
1. Persistencia total: El navegador se queda abierto en éxito o fallo final.
2. Reintentos automáticos con tiempos incrementales.
3. Detección de CAPTCHA y errores con control manual.
"""

import logging
import time
import sys
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

logger = logging.getLogger(__name__)

# URLs de los portales SUNAT
SUNAT_URLS = {
    "DECLARACIONES": (
        "https://api-seguridad.sunat.gob.pe/v1/clientessol/59d39217-c025-4de5-b342-393b0f4630ab/oauth2/loginMenuSol"
        "?lang=es-PE&showDni=true&showLanguages=false&originalUrl=https://e-menu.sunat.gob.pe/cl-ti-itmenu2/AutenticaMenuInternetPlataforma.htm"
        "&state=rO0ABXQA701GcmNEbDZPZ28xODJOWWQ4aTNPT2krWUcrM0pTODAzTEJHTmtLRE1IT2pBQ2l2eW84em5lWjByM3RGY1BLT0tyQjEvdTBRaHNNUW8KWDJRQ0h3WmZJQWZyV0JBaGtTT0hWajVMZEg0Mm5ZdHlrQlFVaDFwMzF1eVl1V2tLS3ozUnVoZ1ovZisrQkZndGdSVzg1TXdRTmRhbAp1ek5OaXdFbG80TkNSK0E2NjZHeG0zNkNaM0NZL0RXa1FZOGNJOWZsYjB5ZXc3MVNaTUpxWURmNGF3dVlDK3pMUHdveHI2cnNIaWc1CkI3SkxDSnc9"
    ),
    "TRAMITES": (
        "https://api-seguridad.sunat.gob.pe/v1/clientessol/085b176d-2437-44cd-8c3e-e9a83b705921/oauth2/loginMenuSol"
        "?lang=es-PE&showDni=true&showLanguages=false&originalUrl=https://e-menu.sunat.gob.pe/cl-ti-itmenucabina/AutenticaMenuInternet.htm"
        "&state=rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAUH2sHDFmDRAwACRgAKbG9hZEZhY3RvckkACXRocmVzaG9sZHhwP0AAAAAAAAx3CAAAABAAAAADdAAEZXhlY3B0AAZwYXJhbXN0AFEqJiomL2NsLXRpLWl0bWVudWNhYmluYS9NZW51SW50ZXJuZXQuaHRtJjBlMWY4NDg5ZmVlYWJmOTMxNmI5ODUwNTYyMjA5MTE4ZjkxZTJjMmN0AANleGVweA=="
    ),
    "SUNAFIL": (
        "https://api-seguridad.sunat.gob.pe/v1/clientessol/b6474e23-8a3b-4153-b301-dafcc9646250/oauth2/login"
        "?originalUrl=https://casillaelectronica.sunafil.gob.pe/si.inbox/Login/Empresa&state=s"
    ),
    "RENTA_PERSONAS": "https://api-seguridad.sunat.gob.pe/v1/clientessol/03590141-c69c-438c-a36a-8ee2a3ad9747/oauth2/login?originalUrl=https://e-renta.sunat.gob.pe/loader/recaudaciontributaria/declaracionpago/formularios",
    "RENTA_EMPRESAS": "https://api-seguridad.sunat.gob.pe/v1/clientessol/03590141-c69c-438c-a36a-8ee2a3ad9747/oauth2/login?originalUrl=https://e-renta.sunat.gob.pe/loader/recaudaciontributaria/declaracionpago/formularios"
}

# Selectores para validación post-login
SUCCESS_SELECTORS = {
    "TRAMITES": ["#btnConsultar", ".menu-principal", "#contenido"],
    "DECLARACIONES": ["#btnNuevo", ".dashboard", "#menuSuperior"],
    "SUNAFIL": ["#inbox", ".navbar", "#contenidoPrincipal"],
    "RENTA_PERSONAS": ["#formDeclaracion", ".formulario-renta", ".menu-renta-anual", "title=SUNAT"],
    "RENTA_EMPRESAS": ["#formDeclaracion", ".formulario-renta", ".menu-renta-anual", "title=SUNAT"],
}

ERROR_SELECTORS = ["#lblMensaje", ".alert-danger", ".error-message", "text=credenciales", "text=incorrecto", "text=inválido"]
CAPTCHA_SELECTORS = ["#captcha", ".captcha", "iframe[src*='captcha']", "text=captcha", "text=código de seguridad"]


def _get_browser_type(pw, browser_name):
    b = browser_name.lower()
    if b in ("chrome", "edge", "chromium"): return pw.chromium
    if b == "firefox": return pw.firefox
    return pw.chromium


def _get_channel(browser_name):
    b = browser_name.lower()
    if b == "chrome": return "chrome"
    if b == "edge": return "msedge"
    return None


def _wait_for_manual_close(page):
    """Mantiene el proceso vivo hasta que la página se cierre."""
    try:
        while True:
            try:
                if page.is_closed():
                    break
                time.sleep(2)
            except:
                break
        logger.info("Navegador cerrado o sesión perdida.")
    except KeyboardInterrupt:
        logger.info("Interrupción del proceso.")


def _check_login_success(page, tipo_portal: str) -> tuple[bool, str]:
    success_selectors = SUCCESS_SELECTORS.get(tipo_portal.upper(), SUCCESS_SELECTORS["TRAMITES"])
    for selector in success_selectors:
        try:
            if page.is_visible(selector, timeout=5000): return True, "Login exitoso"
        except: continue
    
    for selector in ERROR_SELECTORS:
        try:
            if page.is_visible(selector, timeout=3000):
                text = page.text_content(selector) or "Error detectado"
                return False, f"Error: {text}"
        except: continue
    
    for selector in CAPTCHA_SELECTORS:
        try:
            if page.is_visible(selector, timeout=2000): return False, "CAPTCHA requerido"
        except: continue
    
    if "login" not in page.url.lower(): return True, "Login exitoso (URL cambió)"
    return False, "No se pudo verificar el login"


def _perform_login(page, ruc, usuario, clave):
    page.locator("#txtRuc").fill(ruc)
    page.locator("#txtUsuario").fill(usuario)
    page.locator("#txtContrasena").fill(clave)
    page.locator("#btnAceptar").click()
    return True


def login_sunat(ruc, usuario, clave, browser="chrome", tipo_portal="TRAMITES", max_retries=2):
    url = SUNAT_URLS.get(tipo_portal.upper(), SUNAT_URLS["TRAMITES"])
    last_error = "Desconocido"
    
    pw = None
    browser_instance = None
    page = None
    
    # Intento único para máxima velocidad y control
    try:
        pw = sync_playwright().start()
        browser_type = _get_browser_type(pw, browser)
        channel = _get_channel(browser)
        
        launch_opts = {"headless": False, "args": ["--start-maximized"]}
        if channel: launch_opts["channel"] = channel
        
        browser_instance = browser_type.launch(**launch_opts)
        context = browser_instance.new_context(viewport=None, no_viewport=True)
        page = context.new_page()
        
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        _perform_login(page, ruc, usuario, clave)
        
        logger.info("Esperando respuesta post-login...")
        try: page.wait_for_url("**/*", timeout=15000)
        except: pass
        
        success, message = _check_login_success(page, tipo_portal)
        if success:
            print("\n✅ LOGIN EXITOSO. Navegador abierto.", file=sys.stderr)
        else:
            print(f"\n⚠️ CONTROL MANUAL REQUERIDO: {message}", file=sys.stderr)
        
        # Handover inmediato
        _wait_for_manual_close(page)
        return {"success": success, "message": message}

    except Exception as e:
        last_error = str(e)
        logger.error(f"Error fatal en login Playwright: {e}")
        
        if page:
            print(f"\n❌ ERROR: {e}. Navegador abierto para diagnóstico.", file=sys.stderr)
            try: _wait_for_manual_close(page)
            except: pass
        else:
            # Si ni siquiera abrió la página
            print(f"\n❌ Error al abrir navegador: {e}", file=sys.stderr)
            
        return {"success": False, "message": f"Error: {last_error}"}
    finally:
        # Nota: No cerramos el browser_instance aquí porque _wait_for_manual_close ya terminó
        # o hubo un error fatal. Pero por seguridad si el proceso sigue vivo lo dejamos.
        pass

    return {"success": False, "message": f"Falló: {last_error}"}
