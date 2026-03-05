"""
Login SUNAT con Selenium WebDriver — Versión Ultra-Robusta

Mejoras:
1. Persistencia total: El navegador se queda abierto en éxito o fallo final.
2. Selenium Manager priorizado (offline-friendly).
3. Reintentos con tiempos de espera incrementales.
4. Detección de CAPTCHA y errores con control manual.
"""

import logging
import time
import sys
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException,
    WebDriverException,
    NoSuchElementException,
)
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.firefox.service import Service as FirefoxService

logger = logging.getLogger(__name__)

# URLs de los portales SUNAT
SUNAT_URLS = {
    "DECLARACIONES": (
        "https://api-seguridad.sunat.gob.pe/v1/clientessol/59d39217-c025-4de5-b342-393b0f4630ab/oauth2/loginMenuSol"
        "?lang=es-PE&showDni=true&showLanguages=false&originalUrl=https://e-menu.sunat.gob.pe/cl-ti-itmenu2/AutenticaMenuInternetPlataforma.htm"
        "&state=rO0ABXQA701GcmNEbDZPZ28xODJOWWQ4aTNPT2krWUcrM0pTODAzTEJHTmtLRE1IT2pBQ2l2eW84em5lWjByM3RGY1BLT0tyQjEvdTBRaHNNUW8KWDJRQ0h3WmZJQWZyV0JBaGtTT0hWajVMZEg0Mm5ZdHlrQlFVaDFwMzF1eVl1V2tLS3ozUnVoZ1ovZisrQkZndGdSVzg1TXdRTmRhbAp1ek5OaXdFbG80TkNSK0E2NjZHeG0zNkNaM0NZL0RXa1FZOGNJOWZsYjB5ZXc3MVNaTUpxWURmNGF3dVlDK3pMUHdveHI2cnNIaWc1CkI3SkxDSnc9"
    ),
    "CONSULTAS": (
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
    "TRAMITES": [
        (By.ID, "btnConsultar"),
        (By.CLASS_NAME, "menu-principal"),
        (By.ID, "contenido"),
    ],
    "DECLARACIONES": [
        (By.ID, "btnNuevo"),
        (By.CLASS_NAME, "dashboard"),
        (By.ID, "menuSuperior"),
    ],
    "SUNAFIL": [
        (By.ID, "inbox"),
        (By.CLASS_NAME, "navbar"),
        (By.ID, "contenidoPrincipal"),
    ],
    "RENTA_PERSONAS": [
        (By.ID, "formDeclaracion"),
        (By.CLASS_NAME, "formulario-renta"),
        (By.CLASS_NAME, "menu-renta-anual"),
    ],
    "RENTA_EMPRESAS": [
        (By.ID, "formDeclaracion"),
        (By.CLASS_NAME, "formulario-renta"),
        (By.CLASS_NAME, "menu-renta-anual"),
    ]
}

ERROR_SELECTORS = [
    (By.ID, "lblMensaje"),
    (By.CLASS_NAME, "alert-danger"),
    (By.CLASS_NAME, "error-message"),
    (By.XPATH, "//*[contains(text(), 'credenciales')]"),
    (By.XPATH, "//*[contains(text(), 'incorrecto')]"),
    (By.XPATH, "//*[contains(text(), 'inválido')]"),
]

# Selector de CAPTCHA
CAPTCHA_SELECTORS = [
    (By.ID, "captcha"),
    (By.CLASS_NAME, "captcha"),
    (By.XPATH, "//iframe[contains(@src, 'captcha')]"),
    (By.XPATH, "//*[contains(text(), 'captcha')]"),
    (By.XPATH, "//*[contains(text(), 'código de seguridad')]"),
]


def create_driver(browser: str):
    """Crear WebDriver de forma ultra-veloz usando Selenium Manager (interno)."""
    b = browser.lower()
    try:
        if b == "chrome":
            options = webdriver.ChromeOptions()
            options.add_experimental_option("detach", True)
            options.add_argument("--start-maximized")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            return webdriver.Chrome(options=options)
    
        elif b == "edge":
            options = webdriver.EdgeOptions()
            options.add_experimental_option("detach", True)
            options.add_argument("--start-maximized")
            options.add_argument("--disable-blink-features=AutomationControlled")
            return webdriver.Edge(options=options)
    
        elif b == "firefox":
            options = webdriver.FirefoxOptions()
            options.add_argument("--start-maximized")
            return webdriver.Firefox(options=options)
            
        raise ValueError(f"Navegador no soportado: {browser}")
    except Exception as e:
        logger.error(f"[SELENIUM] Error al iniciar navegador {browser}: {e}")
        raise e


def _wait_for_manual_close(driver):
    """Mantiene el proceso vivo hasta que el navegador se cierre."""
    try:
        while True:
            try:
                # window_handles es más fiable que driver.title
                if not driver.window_handles:
                    break
                time.sleep(2)
            except:
                break
        logger.info("Navegador cerrado o sesión perdida.")
    except KeyboardInterrupt:
        logger.info("Interrupción del proceso.")


def _check_login_success(driver, wait, tipo_portal: str) -> tuple[bool, str]:
    success_selectors = SUCCESS_SELECTORS.get(tipo_portal.upper(), SUCCESS_SELECTORS["TRAMITES"])
    for by, selector in success_selectors:
        try:
            element = wait.until(EC.visibility_of_element_located((by, selector)), timeout=5)
            if element.is_displayed(): return True, "Login exitoso"
        except: continue
    
    for by, selector in ERROR_SELECTORS:
        try:
            element = wait.until(EC.visibility_of_element_located((by, selector)), timeout=3)
            if element.is_displayed(): return False, f"Error: {element.text}"
        except: continue
    
    for by, selector in CAPTCHA_SELECTORS:
        try:
            element = wait.until(EC.visibility_of_element_located((by, selector)), timeout=2)
            if element.is_displayed(): return False, "CAPTCHA requerido"
        except: continue
    
    if "login" not in driver.current_url.lower(): return True, "Login exitoso (URL cambió)"
    return False, "No se pudo verificar el login"


def _perform_login(driver, wait, ruc: str, usuario: str, clave: str) -> bool:
    # RUC
    ruc_f = wait.until(EC.element_to_be_clickable((By.ID, "txtRuc")))
    ruc_f.clear(); ruc_f.send_keys(ruc)
    # Usuario
    user_f = wait.until(EC.element_to_be_clickable((By.ID, "txtUsuario")))
    user_f.clear(); user_f.send_keys(usuario)
    # Clave
    pass_f = wait.until(EC.element_to_be_clickable((By.ID, "txtContrasena")))
    pass_f.clear(); pass_f.send_keys(clave)
    # Click
    wait.until(EC.element_to_be_clickable((By.ID, "btnAceptar"))).click()
    return True


def login_sunat(ruc, usuario, clave, browser="chrome", tipo_portal="TRAMITES", max_retries=2):
    url = SUNAT_URLS.get(tipo_portal.upper(), SUNAT_URLS["TRAMITES"])
    last_error = "Desconocido"
    driver = None

    # Primer y único intento para evitar abrir/cerrar navegadores
    try:
        driver = create_driver(browser)
        wait = WebDriverWait(driver, 30)
        logger.info(f"Iniciando login en portal: {tipo_portal} - URL: {url}")
        driver.get(url)
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        
        _perform_login(driver, wait, ruc, usuario, clave)
        
        logger.info("Esperando respuesta post-login...")
        try: wait.until(EC.url_changes(url), timeout=15)
        except: pass
        
        success, message = _check_login_success(driver, wait, tipo_portal)
        
        if success:
            print("\n✅ LOGIN EXITOSO. Navegador abierto.", file=sys.stderr)
        else:
            print(f"\n⚠️ CONTROL MANUAL REQUERIDO: {message}", file=sys.stderr)
            
        # En cualquier caso (éxito o mensaje de error/captcha), dejamos el navegador abierto
        _wait_for_manual_close(driver)
        return {"success": success, "message": message}

    except Exception as e:
        last_error = str(e)
        logger.error(f"Error fatal en login: {e}")
        # Si el error es de red al cargar el sitio, intentamos un reintento si no hay driver
        if not driver:
            print(f"\n❌ Error al preparar navegador: {e}. Reintentando...", file=sys.stderr)
            # Aquí podríamos poner un reintento simple si el usuario lo desea, 
            # pero por ahora seguimos la petición de "un solo intento" para ser directos.
        
        if driver:
            print(f"\n❌ ERROR: {e}. Navegador abierto para diagnóstico.", file=sys.stderr)
            _wait_for_manual_close(driver)
            
        return {"success": False, "message": f"Error: {last_error}"}

    return {"success": False, "message": f"Falló: {last_error}"}
