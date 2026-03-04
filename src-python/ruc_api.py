import json
import logging
import requests
import urllib3
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Suprimir advertencias de SSL para mantener el stdout limpio
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

# Configuración de API Migo (ÚNICA - más rápido)
MIGO_TOKEN = os.getenv("MIGO_TOKEN", "zV6s4CQCvNxxNZ6lSeKF0nIOaVq3axrtcU6lZQS7p74LrQQRg6MPUrLYCS6D")
MIGO_URL = os.getenv("MIGO_URL", "https://api.migo.pe/api/v1/ruc")

# Timeout reducido para velocidad (5 segundos)
TIMEOUT = 5

def clean_string(s):
    """Limpia y normaliza una cadena de texto."""
    if not s:
        return ""
    return " ".join(s.split()).strip()

def validar_ruc(ruc: str) -> bool:
    """Valida que el RUC tenga 11 dígitos numéricos."""
    if not ruc or len(ruc) != 11 or not ruc.isdigit():
        return False
    return True

def consultar_ruc(ruc: str) -> dict:
    """
    Consulta el RUC en la API Migo de forma OPTIMIZADA para máxima velocidad.
    
    Args:
        ruc: Número de RUC a consultar (11 dígitos)
    
    Returns:
        dict con los datos del RUC o mensaje de error
    """
    # Validación rápida
    if not validar_ruc(ruc):
        return {"success": False, "message": "RUC debe tener 11 dígitos numéricos"}
    
    logger.info(f"Consultando RUC {ruc} (MIGO POST)...")
    
    try:
        # Payload optimizado
        payload = {"ruc": ruc, "token": MIGO_TOKEN}
        
        # Headers mínimos
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Request POST directo con timeout reducido
        response = requests.post(
            MIGO_URL,
            json=payload,
            headers=headers,
            timeout=TIMEOUT,  # 5 segundos - más rápido
            verify=False
        )
        
        logger.info(f"Respuesta Migo: Status {response.status_code}")
        
        if response.status_code != 200:
            return {
                "success": False,
                "message": f"Error API (Status {response.status_code})"
            }
        
        data = response.json()
        
        if data.get("success"):
            info = data.get("data", {})
            if not info and "nombre_o_razon_social" in data:
                info = data
            
            # Extracción directa de datos
            razon_social = clean_string(
                info.get("nombre_o_razon_social") or
                info.get("razon_social") or
                info.get("razonSocial", "")
            )
            
            estado = clean_string(
                info.get("estado_del_contribuyente") or
                info.get("estado") or
                info.get("estado_contribuyente", "")
            )
            
            condicion = clean_string(
                info.get("condicion_de_domicilio") or
                info.get("condicion") or
                info.get("condicion_domicilio", "")
            )
            
            direccion = clean_string(
                info.get("direccion_simple") or
                info.get("direccion") or
                info.get("direccion_completa", "")
            )
            
            logger.info(f"RUC {ruc} encontrado: {razon_social} (Estado: {estado}, Condición: {condicion})")
            return {
                "success": True,
                "ruc": info.get("ruc", ruc),
                "RazonSocial": razon_social,
                "estado": estado if estado else "ACTIVO",
                "condicion": condicion if condicion else "HABIDO",
                "direccion": direccion,
                "message": f"RUC {ruc} encontrado"
            }
        else:
            msg = data.get("message", "RUC no válido o no encontrado")
            return {"success": False, "message": msg}
    
    except requests.exceptions.Timeout:
        return {"success": False, "message": "Timeout (5s) - intente nuevamente"}
    except requests.exceptions.SSLError:
        return {"success": False, "message": "Error SSL"}
    except requests.exceptions.RequestException as e:
        logger.error(f"Error de red: {e}")
        return {"success": False, "message": f"Error conexión: {str(e)}"}
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        return {"success": False, "message": f"Error interno: {str(e)}"}
