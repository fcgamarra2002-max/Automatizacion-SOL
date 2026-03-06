"""
Módulo de cifrado para ClaveSOL.

SKILL: Buenas prácticas de manejo de credenciales — keyring/secure storage.
Usa Fernet (cifrado simétrico) para proteger la ClaveSOL en la base de datos Access.
La clave maestra se almacena en variable de entorno SUNAT_MASTER_KEY.
"""

import os
import sys
import base64
from cryptography.fernet import Fernet

# Ruta al archivo de clave maestra (en el directorio data/)
_KEY_FILE_ENV = "SUNAT_MASTER_KEY"
_KEY_FILE_PATH_ENV = "SUNAT_KEY_FILE"
IN_MEMORY_KEY = None
_SEARCH_DIR_HINT = None

def set_key_search_dir(path: str):
    """Sugerir un directorio donde buscar la llave (ej. el dircotorio de la DB)."""
    global _SEARCH_DIR_HINT
    _SEARCH_DIR_HINT = path


def generate_key() -> str:
    """
    Generar una nueva clave maestra Fernet.
    Retorna la clave como string base64.
    """
    return Fernet.generate_key().decode()


def save_key_to_file(filepath: str) -> str:
    """
    Generar y guardar una clave maestra en un archivo.
    Retorna la clave generada.
    """
    key = generate_key()
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(key)
    return key


def get_master_key() -> bytes:
    """
    Obtener la clave maestra buscando exhaustivamente en el sistema de archivos.
    """
    global IN_MEMORY_KEY
    if IN_MEMORY_KEY is not None:
        return IN_MEMORY_KEY

    # 1. Prioridad: Variable de entorno directa SUNAT_MASTER_KEY
    key_from_env = os.environ.get(_KEY_FILE_ENV)
    if key_from_env:
        IN_MEMORY_KEY = key_from_env.encode()
        return IN_MEMORY_KEY

    candidates = []

    # 2. Prioridad: Variable de entorno SUNAT_DB_PASSWORD (apunta a un archivo)
    env_db_password_path = os.environ.get("SUNAT_DB_PASSWORD")
    if env_db_password_path:
        candidates.append(env_db_password_path)

    # 3. Prioridad: Ruta por variable de entorno SUNAT_KEY_FILE
    key_file_path_env = os.environ.get(_KEY_FILE_PATH_ENV)
    if key_file_path_env:
        candidates.append(key_file_path_env)

    # 4. Prioridad: Directorio sugerido (Hint)
    if _SEARCH_DIR_HINT:
        candidates.append(os.path.join(_SEARCH_DIR_HINT, "master.key"))
        candidates.append(os.path.join(os.path.dirname(_SEARCH_DIR_HINT), "master.key"))

    # 4. Prioridad: Carpeta de datos de la aplicación (LOCALAPPDATA en Windows)
    app_data = os.environ.get('LOCALAPPDATA')
    if app_data:
        # Rutas comunes para esta aplicación
        candidates.append(os.path.join(app_data, "Automatizacion-SOL", "data", "master.key"))
        candidates.append(os.path.join(app_data, "Automatizacion-SOL", "master.key"))
        candidates.append(os.path.join(app_data, "com.sunat.automation.v1", "data", "master.key"))

    # 5. Búsqueda en directorios relativos y hacia arriba
    # sys.argv[0] es vital en ejecutables de PyInstaller
    search_starts = [
        os.getcwd(),
        os.path.dirname(os.path.abspath(__file__)),
        os.path.dirname(os.path.abspath(sys.argv[0]))
    ]
    
    for start_dir in search_starts:
        curr = start_dir
        # Buscar hasta 5 niveles hacia arriba
        for _ in range(6):
            # Probar en la raíz del nivel actual y en subcarpeta data/
            candidates.append(os.path.join(curr, "master.key"))
            candidates.append(os.path.join(curr, "data", "master.key"))
            
            parent = os.path.dirname(curr)
            if parent == curr: # Llegamos a la raíz del disco
                break
            curr = parent

    # Eliminar duplicados manteniendo orden
    seen = set()
    unique_candidates = []
    for c in candidates:
        if c and c not in seen:
            unique_candidates.append(c)
            seen.add(c)

    # Normalizar y limpiar candidatos
    final_candidates = []
    for c in unique_candidates:
        if not c: continue
        # Eliminar prefijos de ruta extendida \\?\ que a veces confunden a Python en modo EXE
        clean_path = c.replace("\\\\?\\", "").replace("//?/", "")
        final_candidates.append(os.path.normpath(clean_path))

    for path in final_candidates:
        if os.path.exists(path) and os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content and len(content) >= 32: # Validar longitud mínima
                        IN_MEMORY_KEY = content.encode()
                        return IN_MEMORY_KEY
            except Exception:
                continue

    raise RuntimeError(
        f"Error: No se encontró la llave maestra (master.key). Busqué en: {final_candidates}. "
        "Asegúrese de que el archivo existe en la carpeta 'data'."
    )


def get_cipher() -> Fernet:
    """Crear instancia Fernet con la clave maestra."""
    return Fernet(get_master_key())


def encrypt_clave(plain_text: str) -> str:
    """
    Cifrar una ClaveSOL en texto plano.
    Retorna el token cifrado como string.

    SKILL: Manejo cuidadoso — la clave en texto plano solo existe temporalmente.
    """
    cipher = get_cipher()
    encrypted = cipher.encrypt(plain_text.encode())
    return encrypted.decode()


def decrypt_clave(encrypted_token: str) -> str:
    """
    Descifrar una ClaveSOL cifrada.
    Retorna la clave en texto plano.

    ⚠️ NUNCA loguear el resultado de esta función.
    """
    cipher = get_cipher()
    decrypted = cipher.decrypt(encrypted_token.encode())
    return decrypted.decode()
