# 🚀 Guía de Actualizaciones Automáticas (Tauri v2)

Tu aplicación ya está preparada para buscar actualizaciones automáticamente. Aquí te explico qué pasos debes seguir cada vez que quieras lanzar una nueva versión a tus usuarios.

---

## 🛠️ Requisitos previos

1. **Llave de Firmado**: Tienes una llave pública configurada en `tauri.conf.json`. Para generar el instalador firmado, debes tener la variable de entorno `TAURI_SIGNING_PRIVATE_KEY` configurada en tu máquina o el archivo de clave privada `.key`.
2. **Repositorio de GitHub**: Tu aplicación busca el archivo `update.json` en:
   `https://raw.githubusercontent.com/fcgamarra2002-max/Automatizacion-SOL/master/update.json`

---

## 🔄 Proceso para lanzar una actualización

### 1. Incrementar la Versión
Edita los siguientes archivos y sube el número de versión (ej. de `0.1.4` a `0.1.5`):
- `package.json`: `"version": "0.1.5"`
- `src-tauri/tauri.conf.json`: `"version": "0.1.5"`

### 2. Compilar y Firmar
Ejecuta el comando de compilación. Tauri generará los archivos comprimidos para el updater (`.zip`) y te dará la **firma (signature)**.

```bash
npm run tauri build
```

Al finalizar, busca en la consola un mensaje similar a este:
> `Bundler created 1 bundle at: ...\Automatizacion-SOL_0.1.5_x64-setup.nsis.zip`
> `Signature: [CADENA_DE_TEXTO_LARGA]`

### 3. Crear una "Release" en GitHub
1. Ve a tu repositorio en GitHub -> **Releases** -> **Draft a new release**.
2. Pon como tag `v0.1.5`.
3. Sube el archivo `.zip` generado (el que termina en `.nsis.zip` o `.msi.zip`).
4. Publica la Release.
5. Copia el enlace directo de descarga del archivo `.zip`.

### 4. Actualizar el archivo `update.json`
Crea o edita el archivo `update.json` en la raíz de tu proyecto con este formato:

```json
{
  "version": "0.1.5",
  "notes": "Descripción de los cambios (ej. Usuario SOL ahora en mayúsculas).",
  "pub_date": "2026-03-06T20:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "PEGA_AQUI_LA_SIGNATURE_DE_LA_CONSOLA",
      "url": "PEGA_AQUI_EL_ENLACE_DE_GITHUB_AL_ZIP"
    }
  }
}
```

### 5. Subir `update.json` a GitHub
Haz un *push* del archivo `update.json` a la rama `master`. 

---

## 🎯 ¿Qué pasará después?

Cuando tus usuarios abran la aplicación (o hagan clic en el icono de actualización), la app leerá ese archivo JSON. Si ve que la versión es mayor a la que tienen instalada:
1. Les mostrará un aviso: *"Nueva versión 0.1.5 disponible"*.
2. Descargará el ZIP automáticamente.
3. Verificará la firma contra tu `pubkey`.
4. Instalara la actualización y se reiniciará sola.

---

> [!IMPORTANT]
> Nunca pierdas tu clave privada de firmado. Sin ella, no podrás emitir actualizaciones que las aplicaciones instaladas acepten.
