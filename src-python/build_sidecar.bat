@echo off
REM ============================================================
REM Script de compilación del sidecar Python con PyInstaller.
REM SKILL: PyInstaller para compilar Python a .exe sidecar.
REM SKILL: Tauri v2 — el target triple suffix es requerido.
REM ============================================================

echo 🔧 Compilando sidecar Python para Tauri v2...
echo.

cd /d "%~dp0"

REM Instalar dependencias
echo [1/4] Instalando dependencias...
pip install -r requirements.txt
pip install pyinstaller pywin32

REM Instalar navegadores de Playwright
echo [2/4] Instalando navegadores de Playwright...
python -m playwright install chromium firefox

REM Compilar con PyInstaller
echo [3/4] Compilando con PyInstaller...
pyinstaller --onefile ^
    --name sunat-sidecar ^
    --collect-all selenium ^
    --collect-all playwright ^
    --hidden-import=pyodbc ^
    --hidden-import=cryptography ^
    --hidden-import=webdriver_manager ^
    --hidden-import=db_access ^
    --hidden-import=models ^
    --hidden-import=crypto ^
    --hidden-import=sunat_selenium ^
    --hidden-import=sunat_playwright ^
    --hidden-import=ruc_api ^
    --hidden-import=db_setup ^
    --hidden-import=selenium.webdriver.chrome.options ^
    --hidden-import=selenium.webdriver.edge.options ^
    --hidden-import=selenium.webdriver.firefox.options ^
    main.py

REM Copiar al directorio de binarios de Tauri con el target triple
echo [4/4] Copiando a src-tauri\binaries...
copy /Y dist\sunat-sidecar.exe ..\src-tauri\binaries\sunat-sidecar-x86_64-pc-windows-msvc.exe

echo.
echo ✅ Sidecar compilado exitosamente (Versión Robusta).
echo    Ubicación: src-tauri\binaries\sunat-sidecar-x86_64-pc-windows-msvc.exe
echo.
echo 💡 Para probar el sidecar directamente:
echo    dist\sunat-sidecar.exe list-empresas --db ..\data\empresas.accdb
echo.
echo ✅ Build finished.
