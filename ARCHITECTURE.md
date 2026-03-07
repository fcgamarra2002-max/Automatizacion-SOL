# 🏗️ Arquitectura Técnica: Automatizacion-SOL

Este documento detalla la infraestructura y el flujo de datos del proyecto para asegurar la consistencia en el mantenimiento y escalabilidad.

---

## 🗺️ Mapa de Componentes

### 1. Capa de Presentación (Frontend)
- **Tecnología**: React + Vite.
- **Comunicación**: `src/services/tauriService.js` actúa como el broker de mensajes hacia el backend de Rust, gestionando la inicialización de la base de datos y las peticiones al servidor persistente de Python.
- **Estado**: Gestión de estado local y caché en `localStorage` para una respuesta visual instantánea.

### 2. Capa de Sistema (Backend Rust / Tauri)
- **Fichero Principal**: `src-tauri/src/lib.rs`.
- **Responsabilidades**:
    - Orquestación de procesos sidecar.
    - Operaciones de E/S de alto nivel (Backups ZIP, migraciones de archivos de sistema).
    - Gestión de rutas persistentes en `AppData`.
    - Registro de plugins (`shell`, `fs`, `dialog`).

### 3. Capa de Lógica de Negocio (Sidecar Python)
- **Fichero Principal**: `src-python/main.py`.
- **Módulos Críticos**:
    - `crypto.py`: Implementación del cifrado Fernet con búsqueda de llave distribuida y persistencia atómica.
    - `db_access.py` / `db_setup.py`: Abstracción de acceso a **SQLite**.
    - `ruc_api.py`: Cliente para la recuperación de datos públicos de SUNAT.
    - `sunat_playwright.py` / `sunat_selenium.py`: Motores de automatización web.

---

## 📋 Gestión de Persistencia

La aplicación ha migrado de Microsoft Access a un esquema de **SQLite** altamente portátil.

- **Nombre del Archivo**: `empresa.db`
- **Ubicación Estándar**: `%LOCALAPPDATA%\Automatizacion-SOL\data\`
- **Seguridad**: Los campos sensibles (`ClaveSOL`) se almacenan como blobs cifrados mediante Fernet (AES-128/256).

### Flujo de Migración (Backward Compatibility)
Al iniciar, el componente de Rust (`setup`) verifica la existencia de archivos antiguos en la carpeta legacy (`com.sunat.automation.v1`) y los migra al nuevo directorio estándar automáticamente para asegurar que el usuario no pierda información histórica.

---

## ⚙️ Ciclo de Vida de una Petición
1. **Acción**: El usuario hace clic en "Login Portal" en la UI.
2. **Broker**: `tauriService.js` envía el `Id` de la empresa y los parámetros al servidor de Python mediante `stdin`.
3. **Lógica**: Python recupera el registro de la DB, desencripta la clave usando la `master.key` y arranca el navegador (Selenium/Playwright).
4. **Respuesta**: Python devuelve un objeto JSON con el estado de la operación.
5. **Feedback**: La UI se actualiza con el resultado de la automatización.

---

## 🛡️ Seguridad y Robustez
- **Cierre del Sidecar**: El servidor de Python cuenta con un mecanismo de *timeout* y cierre automático si el proceso padre (Tauri) finaliza inesperadamente.
- **Failsafe de DB**: Se realizan comprobaciones de integridad antes de realizar el backup e importación para prevenir la pérdida de datos.
