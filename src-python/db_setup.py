"""
Crear la tabla Empresas en SQLite y poblar con datos de prueba.

SKILL: sqlite3 — CREATE TABLE + INSERT INTO SQLite.
SKILL: Cifrado Fernet — las claves de prueba se cifran antes de guardar.
"""

import os
import sys
import sqlite3
from crypto import encrypt_clave, save_key_to_file
import logging

logger = logging.getLogger(__name__)

# Datos de prueba (Vaciados para producción)
DATOS_PRUEBA = []


def create_sqlite_db(db_path: str) -> bool:
    """Crea un nuevo archivo .db si no existe."""
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        
    if os.path.exists(db_path):
        logger.info(f"La base de datos ya existe en: {db_path}")
        return True

    try:
        conn = sqlite3.connect(db_path)
        conn.close()
        logger.info(f"Base de datos SQLite creada exitosamente en: {db_path}")
        return True
    except Exception as e:
        logger.error(f"Error al crear la base de datos SQLite: {e}")
        return False


def get_db_connection(db_path: str):
    """Establece conexión con la base de datos SQLite."""
    try:
        conn = sqlite3.connect(db_path)
        # Habilitar retorno de diccionarios o filas accesibles por nombre
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        logger.error(f"Error al conectar con la base de datos SQLite: {e}")
        return None


def create_tables(conn) -> bool:
    """Crear la tabla Empresas si no existe."""
    try:
        cursor = conn.cursor()
        # En SQLite, podemos usar IF NOT EXISTS directamente
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Empresas (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                RUC TEXT NOT NULL,
                RazonSocial TEXT NOT NULL,
                UsuarioSOL TEXT NOT NULL,
                ClaveSOL TEXT NOT NULL,
                Navegador TEXT,
                TipoPortal TEXT,
                Motor TEXT
            )
        """)
        conn.commit()
        logger.info("Tabla Empresas verificada/creada")
        return True
    except Exception as e:
        logger.error(f"Error al crear tablas: {e}")
        return False


def insert_test_data(conn) -> bool:
    """Insertar datos de prueba con ClaveSOL cifrada."""
    try:
        cursor = conn.cursor()
        # Verificar si ya hay datos
        cursor.execute("SELECT COUNT(*) FROM Empresas")
        count = cursor.fetchone()[0]
        if count > 0:
            logger.info(f"Ya existen {count} registros en Empresas.")
            return True

        for emp in DATOS_PRUEBA:
            clave_cifrada = encrypt_clave(emp["ClaveSOL"])
            cursor.execute(
                "INSERT INTO Empresas (RUC, RazonSocial, UsuarioSOL, ClaveSOL, "
                "Navegador, TipoPortal, Motor) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    emp["RUC"],
                    emp["RazonSocial"],
                    emp["UsuarioSOL"],
                    clave_cifrada,
                    emp["Navegador"],
                    emp["TipoPortal"],
                    emp["Motor"],
                ),
            )

        conn.commit()
        if DATOS_PRUEBA:
            logger.info(f"{len(DATOS_PRUEBA)} empresas de prueba insertadas.")
        return True
    except Exception as e:
        logger.error(f"Error al insertar datos: {e}")
        return False


def setup_all(db_path: str):
    """Orquestador completo: DB -> Tablas -> Datos Prueba"""
    try:
        # Asegurar que existe la carpeta
        db_path = os.path.abspath(db_path)
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
        
        # Notificar a crypto dónde buscar la llave ANTES de proceder
        from crypto import set_key_search_dir
        if db_dir:
            set_key_search_dir(db_dir)
            
        key_file = os.path.join(db_dir, "master.key")
        if not os.path.exists(key_file):
            logger.info("Generando nueva llave maestra...")
            save_key_to_file(key_file)
            # Verificar que se creó
            if not os.path.exists(key_file):
                logger.error("No se pudo crear el archivo master.key")
                return False
            logger.info(f"Clave maestra generada exitosamente en: {key_file}")
        else:
            logger.info(f"Usando clave maestra existente en: {key_file}")

        if not create_sqlite_db(db_path):
            return False
            
        conn = get_db_connection(db_path)
        if not conn:
            return False
            
        try:
            if not create_tables(conn):
                return False
            if not insert_test_data(conn):
                return False
                
            logger.info("Setup de base de datos SQLite completado exitosamente.")
            return True
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Error crítico en setup_all: {e}")
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    # Cambiado por defecto a .db
    db = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "..", "data", "empresas.db"
    )
    setup_all(os.path.abspath(db))
