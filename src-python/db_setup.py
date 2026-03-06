"""
Crear la tabla Empresas en Access y poblar con datos de prueba.

SKILL: pyodbc — CREATE TABLE + INSERT INTO Access.
SKILL: Cifrado Fernet — las claves de prueba se cifran antes de guardar.
"""

import os
import sys
import pyodbc
from crypto import encrypt_clave, save_key_to_file
import logging

logger = logging.getLogger(__name__)

# Configuración de contraseña de la base de datos Access
DB_PASSWORD = os.environ.get("SUNAT_DB_PASSWORD", "sunat_secure_2026")

# Datos de prueba (Vaciados para producción)
DATOS_PRUEBA = []


def create_access_db(db_path: str, password: str = None) -> bool:
    """Crea un nuevo archivo .accdb si no existe."""
    if os.path.exists(db_path):
        logger.info(f"La base de datos ya existe en: {db_path}")
        return True

    try:
        import win32com.client
        catalog = win32com.client.Dispatch("ADOX.Catalog")
        
        # Connection string para Jet 4.0 (nativo de Windows para .mdb)
        conn_str = f"Provider=Microsoft.Jet.OLEDB.4.0;Data Source={db_path};"
        if password:
            conn_str += f"Jet OLEDB:Database Password={password};"
            
        catalog.Create(conn_str)
        catalog = None
        logger.info(f"Base de datos .mdb creada exitosamente en: {db_path}")
        return True
    except Exception as e:
        logger.error(f"Error al crear la base de datos: {e}")
        return False


def get_db_connection(db_path: str, password: str = None):
    """Establece conexión con la base de datos Access buscando el controlador."""
    try:
        # Buscar controladores instalados
        all_drivers = [d for d in pyodbc.drivers()]
        target_driver = None
        
        # Priorizar Driver de Access antiguo para .mdb
        for d in all_drivers:
            if "Microsoft Access Driver (*.mdb)" in d:
                target_driver = d
                break
        
        if not target_driver:
            # Fallback a cualquier driver de Access
            for d in all_drivers:
                if "Microsoft Access" in d:
                    target_driver = d
                    break

        if not target_driver:
            logger.error("No se encontró controlador ODBC de Access (necesario para .mdb).")
            return None

        # Connection string con soporte para contraseña
        conn_str = f"DRIVER={{{target_driver}}};DBQ={db_path};"
        if password:
            conn_str += f"PWD={password};"
            
        conn = pyodbc.connect(conn_str)
        return conn
    except Exception as e:
        logger.error(f"Error al conectar con la base de datos: {e}")
        return None


def create_tables(conn) -> bool:
    """Crear la tabla Empresas si no existe."""
    try:
        cursor = conn.cursor()
        # Verificar si la tabla ya existe
        tables = [t.table_name for t in cursor.tables(tableType="TABLE")]
        if "Empresas" in tables:
            logger.info("La tabla Empresas ya existe")
            return True

        # Crear tabla
        cursor.execute("""
            CREATE TABLE Empresas (
                Id AUTOINCREMENT PRIMARY KEY,
                RUC TEXT(11) NOT NULL,
                RazonSocial TEXT(200) NOT NULL,
                UsuarioSOL TEXT(20) NOT NULL,
                ClaveSOL TEXT(200) NOT NULL,
                Navegador TEXT(20),
                TipoPortal TEXT(20),
                Motor TEXT(20)
            )
        """)
        conn.commit()
        logger.info("Tabla Empresas creada")
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
        logger.info(f"{len(DATOS_PRUEBA)} empresas de prueba insertadas.")
        return True
    except Exception as e:
        logger.error(f"Error al insertar datos: {e}")
        return False


def setup_encryption() -> bool:
    """Asegura que exista una master.key en el directorio de la DB."""
    # Nota: Este paso se maneja ahora desde setup_all con la ruta absoluta
    return True


def setup_all(db_path: str):
    """Orquestador completo: DB -> Tablas -> Datos Prueba"""
    password = DB_PASSWORD
    
    # Asegurar que existe la clave maestra en la misma carpeta que la DB
    db_dir = os.path.dirname(db_path)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        
    key_file = os.path.join(db_dir, "master.key")
    if not os.path.exists(key_file):
        save_key_to_file(key_file)
        logger.info(f"Clave maestra generada en: {key_file}")

    if not create_access_db(db_path, password):
        return False
        
    conn = get_db_connection(db_path, password)
    if not conn:
        return False
        
    try:
        if not create_tables(conn):
            return False
        if not insert_test_data(conn):
            return False
            
        logger.info("Setup de base de datos completado exitosamente con contraseña.")
        return True
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    db = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "..", "data", "empresas.mdb"
    )
    setup_all(os.path.abspath(db))
