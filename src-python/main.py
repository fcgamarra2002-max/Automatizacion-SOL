"""
Entry point del sidecar Python para Tauri.

SKILL: Python intermedio — funciones, módulos, manejo de errores y logging.
SKILL: Diseño de capas — orquestación entre capa datos y capa automatización.

Este script recibe comandos por argumentos CLI y retorna JSON por stdout.
Los logs van a stderr para no contaminar la salida de datos.
"""

import sys
import json
import argparse
import logging
import os
import io

# Forzar UTF-8 en Windows Y deshabilitar el buffering de stdout
# line_buffering=True hace que cada print() con \n se envíe de inmediato al pipe de Tauri
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)

# Configurar logging a un archivo para no ensuciar stdout
log_dir = "logs"
if not os.path.exists(log_dir):
    try: os.makedirs(log_dir)
    except: pass

log_file = os.path.join(log_dir, "sidecar.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    filename=log_file,
    filemode="a",
    encoding="utf-8"
)
logger = logging.getLogger("sunat-sidecar")


def resolve_db_path(db_arg: str) -> str:
    """Resolver la ruta de la base de datos a ruta absoluta y sugerir el directorio a crypto."""
    # Limpiar prefijos de rutas extendidas de Windows que pueden venir de Tauri/SO
    db_clean = db_arg.replace("\\\\?\\", "").replace("//?/", "")
    full_path = os.path.abspath(db_clean) if not os.path.isabs(db_clean) else db_clean
    
    db_dir = os.path.dirname(full_path)
    if os.path.exists(db_dir):
        from crypto import set_key_search_dir
        set_key_search_dir(db_dir)
    return full_path


def cmd_list_empresas(args):
    """Subcomando: listar empresas (sin ClaveSOL)."""
    from db_access import list_empresas
    db = resolve_db_path(args.db)
    rows = list_empresas(db)
    result = {"success": True, "data": rows}
    if hasattr(args, 'request_id') and args.request_id:
        result["request_id"] = args.request_id
    print(json.dumps(result, ensure_ascii=False), flush=True)


def _run_login_thread(db, emp_id, motor, browser, tipo_portal):
    try:
        if motor == "playwright":
            from sunat_playwright import login_sunat
        else:
            from sunat_selenium import login_sunat
        
        from db_access import get_empresa_for_login
        empresa = get_empresa_for_login(db, emp_id)

        login_sunat(
            ruc=empresa["RUC"],
            usuario=empresa["UsuarioSOL"],
            clave=empresa["ClaveSOL"],
            browser=browser,
            tipo_portal=tipo_portal,
        )
    except Exception as e:
        logger.error(f"Error en hilo de login: {e}")


def cmd_login_sunat(args):
    """
    Subcomando: login SUNAT. Lanzado en hilo de fondo para ser "flash fast".
    """
    try:
        from db_access import get_empresa_for_login
        db = resolve_db_path(args.db)
        
        try:
            emp_id = int(args.id)
        except (ValueError, TypeError):
            print(json.dumps({"success": False, "message": f"ID de empresa inválido: {args.id}"}), flush=True)
            return

        empresa = get_empresa_for_login(db, emp_id)

        motor = args.engine or empresa.get("Motor", "selenium")
        browser = args.browser or empresa.get("Navegador", "chrome")
        tipo_portal = args.portal or empresa.get("TipoPortal", "TRAMITES")

        import threading
        t = threading.Thread(target=_run_login_thread, args=(db, emp_id, motor, browser, tipo_portal))
        t.daemon = True # El hilo muere si se cierra el programa principal
        t.start()

        # Respuesta instantánea para no bloquear el servidor multi-tarea
        result = {"success": True, "message": "Iniciando acceso rápido...", "status": "launching"}
        if hasattr(args, 'request_id') and args.request_id:
            result["request_id"] = args.request_id
        print(json.dumps(result, ensure_ascii=False), flush=True)
    except Exception as e:
        logger.error(f"Error en cmd_login_sunat: {e}")
        resp = {"success": False, "message": str(e)}
        if hasattr(args, 'request_id') and args.request_id:
            resp["request_id"] = args.request_id
        print(json.dumps(resp, ensure_ascii=False), flush=True)


def cmd_add_empresa(args):
    """Subcomando: agregar empresa (cifra ClaveSOL)."""
    from db_access import add_empresa
    db = resolve_db_path(args.db)
    data = json.loads(args.data)
    result = add_empresa(db, data)
    if hasattr(args, 'request_id') and args.request_id:
        result["request_id"] = args.request_id
    print(json.dumps(result, ensure_ascii=False), flush=True)


def cmd_update_empresa(args):
    """Subcomando: actualizar empresa."""
    from db_access import update_empresa
    db = resolve_db_path(args.db)
    data = json.loads(args.data)
    result = update_empresa(db, args.id, data)
    if hasattr(args, 'request_id') and args.request_id:
        result["request_id"] = args.request_id
    print(json.dumps(result, ensure_ascii=False), flush=True)


def cmd_delete_empresa(args):
    """Subcomando: eliminar empresa."""
    from db_access import delete_empresa
    db = resolve_db_path(args.db)
    result = delete_empresa(db, args.id)
    if hasattr(args, 'request_id') and args.request_id:
        result["request_id"] = args.request_id
    print(json.dumps(result, ensure_ascii=False), flush=True)


def cmd_consultar_ruc(args):
    """Subcomando: consultar RUC en API Migo."""
    from ruc_api import consultar_ruc
    result = consultar_ruc(args.ruc)
    if hasattr(args, 'request_id') and args.request_id:
        result["request_id"] = args.request_id
    print(json.dumps(result, ensure_ascii=False), flush=True)


def cmd_setup_db(args):
    """Subcomando: crear tabla y datos de prueba."""
    from db_setup import setup_all
    db = resolve_db_path(args.db)
    setup_all(db)
    resp = {"success": True, "message": "Base de datos configurada"}
    if hasattr(args, 'request_id') and args.request_id:
        resp["request_id"] = args.request_id
    print(json.dumps(resp, ensure_ascii=False), flush=True)


def cmd_server(args):
    """
    Subcomando: Modo Servidor Persistente.
    Lee comandos en formato JSON desde stdin y responde por stdout.
    
    IMPORTANTE: NO usar `for line in sys.stdin:` porque usa read-ahead buffering
    en pipes, causando que Python espere un buffer lleno (~4KB) antes de procesar.
    Usamos `readline()` que lee una línea a la vez inmediatamente.
    """
    logger.info("Modo servidor persistente iniciado.")
    
    # Forzar stdin sin buffering de lectura anticipada
    if hasattr(sys.stdin, 'reconfigure'):
        sys.stdin.reconfigure(line_buffering=True)
    
    server_parser = argparse.ArgumentParser(exit_on_error=False)
    subparsers = server_parser.add_subparsers(dest="command")
    register_subparsers(subparsers)

    # Señal de que el servidor está listo
    print(json.dumps({"server": "ready"}), flush=True)

    while True:
        try:
            line = sys.stdin.readline()
        except EOFError:
            break
        
        if not line:  # EOF - stdin cerrado
            break
        
        line = line.strip()
        if not line:
            continue
        if line.lower() in ("exit", "quit"):
            break
        
        try:
            cmd_args_list = json.loads(line)
            parsed = server_parser.parse_args(cmd_args_list)
            
            command_map = {
                "list-empresas": cmd_list_empresas,
                "login-sunat": cmd_login_sunat,
                "add-empresa": cmd_add_empresa,
                "update-empresa": cmd_update_empresa,
                "delete-empresa": cmd_delete_empresa,
                "consultar-ruc": cmd_consultar_ruc,
                "setup-db": cmd_setup_db,
            }
            handler = command_map.get(parsed.command)
            if handler:
                handler(parsed)
            else:
                print(json.dumps({"error": f"Comando desconocido: {parsed.command}"}), flush=True)
        except Exception as e:
            req_id = None
            try:
                msg_json = json.loads(line)
                for i, arg in enumerate(msg_json):
                    if arg == "--request-id" and i+1 < len(msg_json):
                        req_id = msg_json[i+1]
            except: pass
            
            error_resp = {"error": str(e)}
            if req_id: error_resp["request_id"] = req_id
            print(json.dumps(error_resp, ensure_ascii=False), flush=True)

def register_subparsers(subparsers):
    """Refactorización de la creación de subparsers para reuso."""
    # --- list-empresas ---
    p_list = subparsers.add_parser("list-empresas")
    p_list.add_argument("--db", required=True)
    p_list.add_argument("--request-id", default=None)

    # --- login-sunat ---
    p_login = subparsers.add_parser("login-sunat")
    p_login.add_argument("--db", required=True)
    p_login.add_argument("--id", required=True, type=int)
    p_login.add_argument("--browser", default=None)
    p_login.add_argument("--engine", default=None)
    p_login.add_argument("--portal", default=None)
    p_login.add_argument("--request-id", default=None)

    # --- add-empresa ---
    p_add = subparsers.add_parser("add-empresa")
    p_add.add_argument("--db", required=True)
    p_add.add_argument("--data", required=True)
    p_add.add_argument("--request-id", default=None)

    # --- update-empresa ---
    p_update = subparsers.add_parser("update-empresa")
    p_update.add_argument("--db", required=True)
    p_update.add_argument("--id", required=True, type=int)
    p_update.add_argument("--data", required=True)
    p_update.add_argument("--request-id", default=None)

    # --- delete-empresa ---
    p_delete = subparsers.add_parser("delete-empresa")
    p_delete.add_argument("--db", required=True)
    p_delete.add_argument("--id", required=True, type=int)
    p_delete.add_argument("--request-id", default=None)

    # --- consultar-ruc ---
    p_ruc = subparsers.add_parser("consultar-ruc")
    p_ruc.add_argument("--ruc", required=True)
    p_ruc.add_argument("--request-id", default=None)

    # --- setup-db ---
    p_setup = subparsers.add_parser("setup-db")
    p_setup.add_argument("--db", required=True)
    p_setup.add_argument("--request-id", default=None)


def main():
    parser = argparse.ArgumentParser(
        description="SUNAT Automation Sidecar — CLI para Tauri v2"
    )
    subparsers = parser.add_subparsers(dest="command", help="Comandos disponibles")

    # Registrar todos los subparsers estándar
    register_subparsers(subparsers)
    
    # --- server (Modo especial persistente) ---
    subparsers.add_parser("server", help="Modo servidor persistente via stdin")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    try:
        command_map = {
            "list-empresas": cmd_list_empresas,
            "login-sunat": cmd_login_sunat,
            "add-empresa": cmd_add_empresa,
            "update-empresa": cmd_update_empresa,
            "delete-empresa": cmd_delete_empresa,
            "consultar-ruc": cmd_consultar_ruc,
            "setup-db": cmd_setup_db,
            "server": cmd_server,
        }
        handler = command_map.get(args.command)
        if handler:
            handler(args)
        else:
            print(json.dumps({"error": f"Comando no reconocido: {args.command}"}))
            sys.exit(1)

    except Exception as e:
        logger.error(f"Error ejecutando '{args.command}': {e}")
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
