# 🚀 Automatización SUNAT - Smart Access

**Automatización SUNAT** es una solución de escritorio robusta diseñada para simplificar y automatizar los trámites tributarios ante la SUNAT (Perú). Construida sobre la potencia de **Tauri v2** y la flexibilidad de **Python**, esta herramienta ofrece una gestión segura de credenciales SOL, consultas de RUC en tiempo real y automatización de portales mediante Selenium y Playwright.

---

## 🌟 Características Principales

- **Gestión de Empresas**: Almacenamiento centralizado de múltiples RUCs y credenciales SOL.
- **Seguridad de Grado Bancario**: Cifrado AES-256 para todas las contraseñas sensibles, con gestión de llave maestra (`master.key`) local.
- **Arquitectura Sidecar**: Motor de automatización en Python (Selenium/Playwright) integrado de forma nativa.
- **Persistencia Robusta**: Base de datos **SQLite** alojada en `AppData\Local` para máxima confiabilidad.
- **Copia de Seguridad**: Sistema integrado de exportación/importación de backups comprimidos (.zip).
- **Actualizaciones Automáticas**: Soporte para Tauri Updater para mantener la herramienta siempre al día con los cambios de SUNAT.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: [React 19](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [CSS Vanilla Moderno]
- **Backend / Desktop**: [Tauri v2](https://tauri.app/) (Rust)
- **Motor de Automatización**: [Python 3.11](https://www.python.org/)
- **Base de Datos**: [SQLite](https://www.sqlite.org/)
- **Cifrado**: Fernet (Cryptography.io)
- **Automatización**: Selenium & Playwright

---

## 🚀 Guía de Desarrollo

### Requisitos Previos
- Node.js 20+
- Rust (Cargo)
- Python 3.11+

### 1. Preparar el Sidecar (Python)
Para compilar el proceso secundario (motor de automatización):
```bash
cd src-python
build_sidecar.bat
```

### 2. Ejecutar en Modo Desarrollo
```bash
npm install
npm run dev
```

### 3. Compilar Instalador de Producción (.exe)
```bash
npm run tauri build
```
El instalador se generará en: `src-tauri/target/release/bundle/nsis/`

---

## 📁 Estructura del Proyecto

- `src/`: Interfaz de usuario y servicios de comunicación (Frontend).
- `src-tauri/`: Lógica de sistema, comandos de respaldo y empaquetado (Backend Rust).
- `src-python/`: Motor de lógica de negocio, cifrado y base de datos (Sidecar).
- `data/`: Recursos y plantillas de base de datos.

---

## 🔒 Seguridad y Privacidad

- **Llave Maestra**: La aplicación genera una llave única por instalación en `%LOCALAPPDATA%\Automatizacion-SOL\data\master.key`.
- **Base de Datos**: Local y privada (`empresa.db`). Los datos nunca salen de la máquina del usuario hacia servidores externos, excepto para las consultas directas a la API de SUNAT.

---

© 2026 SUNAT Automation Project.
