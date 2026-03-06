"""
CRUD para la tabla Empresas en MS Access.

SKILL: Conexión a MS Access desde Python con pyodbc.
SKILL: Cadena de conexión, consultas SELECT/INSERT/UPDATE.
SKILL: Buenas prácticas — ClaveSOL se cifra/descifra con crypto.py.
"""

import os
import pyodbc
import logging
from models import Empresa
from crypto import encrypt_clave, decrypt_clave

logger = logging.getLogger(__name__)

# Configuración de contraseña de la base de datos Access
DB_PASSWORD = os.environ.get("SUNAT_DB_PASSWORD", "sunat_secure_2026")

def get_connection(db_path: str):
    """Establecer conexión con la DB MS Access buscando el controlador disponible."""
    full_path = os.path.abspath(db_path)
    if not os.path.exists(full_path):
        logger.error(f"Base de datos no encontrada en: {full_path}")
        raise FileNotFoundError(f"No se encontró el archivo de base de datos en: {full_path}")

    # Buscar controladores instalados que soporten Access
    all_drivers = [d for d in pyodbc.drivers()]
    # Para MDB usamos el driver estándar
    target_driver = None
    for d in all_drivers:
        if "Microsoft Access Driver (*.mdb)" in d:
            target_driver = d
            break
    
    if not target_driver:
        # Fallback genérico
        for d in all_drivers:
            if "Microsoft Access" in d:
                target_driver = d
                break

    if not target_driver:
        error_msg = (
            "⚠️ ERROR DE CONTROLADOR ⚠️\n\n"
            "No se encontró el controlador ODBC de Microsoft Access (para archivos .mdb).\n"
            "Esto es inusual en Windows. Por favor contacte a soporte."
        )
        logger.error(error_msg)
        raise pyodbc.Error("IM002", error_msg)

    try:
        conn_str = (
            f"DRIVER={{{target_driver}}};"
            f"DBQ={full_path};"
            f"PWD={DB_PASSWORD};"
        )
        logger.info(f"Conectando a MDB usando driver: {target_driver}")
        return pyodbc.connect(conn_str, autocommit=True)
    except pyodbc.Error as e:
        logger.error(f"Error ODBC al conectar: {e}")
        # Message extra si es el error de arquitectura
        if "IM002" in str(e):
            raise pyodbc.Error("IM002", "Driver no encontrado. Instale Microsoft Access Database Engine (x86).")
        raise


def list_empresas(db_path: str) -> list[dict]:
    """
    Listar todas las empresas con ClaveSOL descifrada.
    SKILL: SELECT exponiendo credenciales localmente (requerimiento del usuario).
    """
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT Id, RUC, RazonSocial, UsuarioSOL, ClaveSOL, Navegador, TipoPortal, Motor "
            "FROM Empresas ORDER BY RazonSocial"
        )
        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Descifrar las claves para enviarlas al frontend
        for row in rows:
            if "ClaveSOL" in row and row["ClaveSOL"]:
                try:
                    row["ClaveSOL"] = decrypt_clave(row["ClaveSOL"])
                except Exception as e:
                    logger.error(f"Error descifrando ClaveSOL para lista: {e}")
                    row["ClaveSOL"] = "" # Fallback si falla el descifrado
                    
        logger.info(f"Listadas {len(rows)} empresas con credenciales")
        return rows
    finally:
        conn.close()


def get_empresa_for_login(db_path: str, empresa_id: int) -> dict:
    """
    Obtener datos completos de una empresa (con ClaveSOL descifrada).
    SOLO para uso interno en login — NUNCA enviar al frontend.
    """
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT Id, RUC, UsuarioSOL, ClaveSOL, Navegador, TipoPortal, Motor "
            "FROM Empresas WHERE Id = ?",
            (empresa_id,),
        )
        row = cursor.fetchone()
        
        if not row:
            raise ValueError(f"Empresa con Id={empresa_id} no encontrada")

        columns = [col[0] for col in cursor.description]
        data = dict(zip(columns, row))

        # Descifrar ClaveSOL
        try:
            data["ClaveSOL"] = decrypt_clave(data["ClaveSOL"])
        except Exception as e:
            logger.error(f"Error descifrando ClaveSOL para empresa {empresa_id}: {e}")
            raise ValueError(
                "No se pudo descifrar la Clave SOL. Esto ocurre si la clave maestra cambió. "
                "Por favor, edita la empresa y vuelve a escribir la Clave SOL para guardarla de nuevo."
            )

        logger.info(f"Datos de login obtenidos para empresa Id={empresa_id}")
        return data
    finally:
        conn.close()


def add_empresa(db_path: str, empresa_data: dict) -> dict:
    """
    Agregar una nueva empresa. La ClaveSOL se cifra antes de guardar.
    SKILL: INSERT con pyodbc + cifrado Fernet.
    """
    empresa = Empresa.from_dict(empresa_data)
    errors = empresa.validate()
    if errors:
        raise ValueError(f"Datos inválidos: {'; '.join(errors)}")
    if not empresa.clave_sol:
        raise ValueError("ClaveSOL es obligatoria para nuevas empresas")

    # Cifrar ClaveSOL antes de guardar
    clave_cifrada = encrypt_clave(empresa.clave_sol)

    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        
        # Verificar RUC duplicado
        cursor.execute("SELECT Id FROM Empresas WHERE RUC = ?", (empresa.ruc,))
        if cursor.fetchone():
            raise ValueError(f"El RUC {empresa.ruc} ya está registrado.")

        cursor.execute(
            "INSERT INTO Empresas (RUC, RazonSocial, UsuarioSOL, ClaveSOL, "
            "Navegador, TipoPortal, Motor) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                empresa.ruc,
                empresa.razon_social,
                empresa.usuario_sol,
                clave_cifrada,
                empresa.navegador,
                empresa.tipo_portal,
                empresa.motor,
            ),
        )
        conn.commit()

        # Obtener el Id generado
        cursor.execute("SELECT @@IDENTITY")
        new_id = cursor.fetchone()[0]
        logger.info(f"Empresa agregada: Id={new_id}, RUC={empresa.ruc}")
        return {"Id": new_id, "message": f"Empresa '{empresa.razon_social}' agregada exitosamente"}
    finally:
        conn.close()


def update_empresa(db_path: str, empresa_id: int, empresa_data: dict) -> dict:
    """
    Actualizar una empresa existente.
    Si se proporciona nueva ClaveSOL, se recifra.
    SKILL: UPDATE con pyodbc.
    """
    empresa = Empresa.from_dict(empresa_data)
    empresa.id = empresa_id

    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()

        # Verificar que existe
        cursor.execute("SELECT Id FROM Empresas WHERE Id = ?", (empresa_id,))
        if not cursor.fetchone():
            raise ValueError(f"Empresa con Id={empresa_id} no encontrada")

        # Verificar RUC duplicado (excluyendo la empresa actual)
        cursor.execute("SELECT Id FROM Empresas WHERE RUC = ? AND Id != ?", (empresa.ruc, empresa_id))
        if cursor.fetchone():
            raise ValueError(f"El RUC {empresa.ruc} ya está registrado en otra empresa.")

        # Si se proporciona nueva clave, cifrarla

        if empresa.clave_sol:
            clave_cifrada = encrypt_clave(empresa.clave_sol)
            cursor.execute(
                "UPDATE Empresas SET RUC=?, RazonSocial=?, UsuarioSOL=?, ClaveSOL=?, "
                "Navegador=?, TipoPortal=?, Motor=? WHERE Id=?",
                (
                    empresa.ruc,
                    empresa.razon_social,
                    empresa.usuario_sol,
                    clave_cifrada,
                    empresa.navegador,
                    empresa.tipo_portal,
                    empresa.motor,
                    empresa_id,
                ),
            )
        else:
            # Actualizar sin cambiar la clave
            cursor.execute(
                "UPDATE Empresas SET RUC=?, RazonSocial=?, UsuarioSOL=?, "
                "Navegador=?, TipoPortal=?, Motor=? WHERE Id=?",
                (
                    empresa.ruc,
                    empresa.razon_social,
                    empresa.usuario_sol,
                    empresa.navegador,
                    empresa.tipo_portal,
                    empresa.motor,
                    empresa_id,
                ),
            )

        conn.commit()
        logger.info(f"Empresa actualizada: Id={empresa_id}")
        return {"message": f"Empresa Id={empresa_id} actualizada exitosamente"}
    finally:
        conn.close()


def delete_empresa(db_path: str, empresa_id: int) -> dict:
    """
    Eliminar una empresa por Id.
    SKILL: DELETE con pyodbc.
    """
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT RazonSocial FROM Empresas WHERE Id = ?", (empresa_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"Empresa con Id={empresa_id} no encontrada")

        nombre = row[0]
        cursor.execute("DELETE FROM Empresas WHERE Id = ?", (empresa_id,))
        conn.commit()

        logger.info(f"Empresa eliminada: Id={empresa_id}, Nombre={nombre}")
        return {"message": f"Empresa '{nombre}' eliminada exitosamente"}
    finally:
        conn.close()
