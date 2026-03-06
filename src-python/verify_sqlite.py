"""
Script de verificación para la migración a SQLite.
"""
import os
import sys
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_sqlite")

# Añadir el directorio actual al path para importar módulos locales
sys.path.append(os.path.dirname(__file__))

from db_setup import setup_all
from db_access import list_empresas, add_empresa, delete_empresa

def main():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "test_empresas.db"))
    
    # 1. Asegurar que no exista una DB previa
    if os.path.exists(db_path):
        os.remove(db_path)
        logger.info(f"DB previa eliminada: {db_path}")

    # 2. Ejecutar Setup
    logger.info("Paso 1: Ejecutando setup_all...")
    if not setup_all(db_path):
        logger.error("Error en setup_all")
        sys.exit(1)
    
    # 3. Listar empresas (debería estar vacía según DATOS_PRUEBA actual)
    logger.info("Paso 2: Listando empresas...")
    empresas = list_empresas(db_path)
    logger.info(f"Empresas encontradas: {len(empresas)}")

    # 4. Agregar empresa de prueba
    logger.info("Paso 3: Agregando empresa de prueba...")
    test_data = {
        "RUC": "20123456789",
        "RazonSocial": "EMPRESA DE PRUEBA SQLITE",
        "UsuarioSOL": "MODALUSER",
        "ClaveSOL": "secret123",
        "Navegador": "chrome",
        "TipoPortal": "TRAMITES",
        "Motor": "selenium"
    }
    res = add_empresa(db_path, test_data)
    logger.info(f"Resultado add_empresa: {res}")
    emp_id = res["Id"]

    # 5. Verificar que se agregó
    empresas = list_empresas(db_path)
    if any(e["Id"] == emp_id for e in empresas):
        logger.info("Verificación exitosa: La empresa fue agregada y listada correctamente.")
    else:
        logger.error("Error: La empresa no aparece en la lista.")
        sys.exit(1)

    # 6. Eliminar empresa
    logger.info("Paso 4: Eliminando empresa de prueba...")
    delete_empresa(db_path, emp_id)
    
    empresas = list_empresas(db_path)
    if not any(e["Id"] == emp_id for e in empresas):
        logger.info("Verificación exitosa: La empresa fue eliminada correctamente.")
    else:
        logger.error("Error: La empresa persiste después de eliminar.")
        sys.exit(1)

    # 7. Limpieza
    os.remove(db_path)
    logger.info("Verificación completa: SQLite funciona correctamente.")

if __name__ == "__main__":
    main()
