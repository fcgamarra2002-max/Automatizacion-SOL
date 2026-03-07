# 📖 Guía del Usuario: Automatización SUNAT

Bienvenido a la guía oficial de **Automatización SUNAT - Smart Access**. Este documento te ayudará a configurar y utilizar la herramienta para gestionar tus trámites de forma eficiente.

---

## 1. Instalación Inicial
1. Descarga el instalador `Automatizacion-SOL_0.1.4_x64-setup.exe`.
2. Ejecuta el instalador y sigue los pasos (proceso estándar de Windows).
3. Al finalizar, abre el programa desde el acceso directo del escritorio.

> [!NOTE]
> La primera vez que abras la aplicación, esta configurará automáticamente tu base de datos y la llave de seguridad. No es necesario realizar pasos técnicos adicionales.

---

## 2. Gestión de Empresas
Para comenzar a automatizar, primero debes registrar tus credenciales SOL:

1. Haz clic en el botón **"+ Nueva Empresa"**.
2. Completa los datos requeridos:
   - **RUC**: 11 dígitos.
   - **Razón Social**: Nombre de la empresa.
   - **Usuario SOL** y **Clave SOL**: Tus credenciales de acceso.
3. Haz clic en **"Guardar"**. Tus datos se almacenarán de forma cifrada en tu disco local.

---

## 3. Uso de la Automatización
Una vez registrada la empresa:

- **Login Portal**: Haz clic en el icono del navegador (Chrome/Firefox) para iniciar sesión automáticamente en el portal de SUNAT.
- **Consulta RUC**: Utiliza la barra de búsqueda para filtrar rápidamente entre tus empresas registradas.
- **Acceso Directo**: La aplicación recordará el último motor de automatización (Selenium o Playwright) que seleccionaste.

---

## 4. Copias de Seguridad (Backup)
Es fundamental proteger tu información:

- **Exportar**: Haz clic en el icono de descarga (flecha hacia abajo) para generar un archivo `.zip`. Este archivo contiene tu base de datos y tu llave de seguridad cifrada. Guárdalo en un lugar seguro (USB o Nube).
- **Importar**: Si cambias de computadora, puedes usar el icono de subida (flecha hacia arriba) para restaurar tu ZIP. **Advertencia**: Esto sobrescribirá los datos actuales de la aplicación.

---

## 5. Resolución de Problemas Comunes

### "No se encontró la llave maestra"
Si ves este error, asegúrate de que no has movido manualmente los archivos en la carpeta `AppData`. Generalmente, se soluciona reiniciando la aplicación para que genere una nueva llave si es necesario.

### "Error de Navegador"
Asegúrate de tener instalado Google Chrome o Firefox en tu sistema. La aplicación utiliza los navegadores instalados para realizar la automatización.

---

© 2026 Equipo de Desarrollo - Automatización Tributaria.
