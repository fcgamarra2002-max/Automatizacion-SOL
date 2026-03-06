# Arquitectura de Sunat-App

Este documento es el mapa maestro del proyecto para asegurar que el desarrollo sea consistente.

## Mapa de Componentes

### 1. Frontend (Vite + JavaScript)
- `src/services/tauriService.js` -> Punto de entrada para llamadas al backend.
- `src/components/` -> UI de la aplicación.

### 2. Backend (Rust / Tauri)
- `src-tauri/src/lib.rs` -> Gestión de comandos y orquestación del sidecar.
- `src-tauri/tauri.conf.json` -> Configuración del sidecar y permisos de red.

### 3. Sidecar (Python 3.x)
- `src-python/main.py` -> Entrypoint del proceso secundario.
- `src-python/crypto.py` -> Gestión de claves SUNAT.
- `src-python/db_access.py` -> Interfaz de la base de datos Access.
- `src-python/sunat_playwright.py` -> Automatización de la web de SUNAT.

## Base de Datos
- **Ruta**: Carpeta de datos de usuario o subdirectorio en `src-python`.
- **Formato**: Microsoft Access (.mdb).
- **Driver**: `Microsoft Access Driver (*.mdb)`.

## Flujo de Trabajo
1. El usuario inicia una acción en la UI.
2. Rust invoca el proceso Python con los argumentos necesarios.
3. Python realiza la tarea (ej. Consulta RUC o Login) y devuelve JSON.
4. Rust parsea y envía al Frontend.
