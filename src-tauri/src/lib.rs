// Configuración Tauri v2 — Registro del plugin shell para sidecar.
// SKILL: Tauri v2 (comandos, plugins, sidecar).

use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zip::{write::FileOptions, ZipWriter};

#[tauri::command]
fn export_backup(dest_path: String) -> Result<String, String> {
    let local_app_data =
        std::env::var("LOCALAPPDATA").map_err(|e| format!("Error leyendo LOCALAPPDATA: {}", e))?;

    let db_dir: PathBuf = [&local_app_data, "com.sunat.automation.v1", "data"]
        .iter()
        .collect();

    let db_file = db_dir.join("empresas.mdb");
    let key_file = db_dir.join("master.key");

    if !db_file.exists() {
        return Err("Error: La base de datos (empresas.mdb) no existe.".into());
    }

    // Preparar el archivo ZIP de destino
    let path = Path::new(&dest_path);
    let file =
        File::create(&path).map_err(|e| format!("Error creando el archivo destino: {}", e))?;
    let mut zip = ZipWriter::new(file);

    let options = FileOptions::<()>::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    // 1. Añadir la base de datos
    zip.start_file("empresas.mdb", options)
        .map_err(|e| format!("Error iniciando entrada ZIP para mdb: {}", e))?;

    let mut f = File::open(&db_file).map_err(|e| format!("Error abriendo base de datos: {}", e))?;
    let mut buffer = Vec::new();
    f.read_to_end(&mut buffer)
        .map_err(|e| format!("Error leyendo base de datos: {}", e))?;
    zip.write_all(&buffer)
        .map_err(|e| format!("Error escribiendo en ZIP: {}", e))?;

    // 2. Añadir la master key si existe
    if key_file.exists() {
        zip.start_file("master.key", options)
            .map_err(|e| format!("Error iniciando entrada ZIP para key: {}", e))?;
        let mut f_key =
            File::open(&key_file).map_err(|e| format!("Error abriendo master key: {}", e))?;
        let mut buffer_key = Vec::new();
        f_key
            .read_to_end(&mut buffer_key)
            .map_err(|e| format!("Error leyendo master key: {}", e))?;
        zip.write_all(&buffer_key)
            .map_err(|e| format!("Error escribiendo key en ZIP: {}", e))?;
    }

    zip.finish()
        .map_err(|e| format!("Error finalizando ZIP: {}", e))?;

    Ok("Copia de seguridad guardada exitosamente.".into())
}

#[tauri::command]
fn import_backup(src_path: String) -> Result<String, String> {
    let local_app_data =
        std::env::var("LOCALAPPDATA").map_err(|e| format!("Error leyendo LOCALAPPDATA: {}", e))?;

    let db_dir: PathBuf = [&local_app_data, "com.sunat.automation.v1", "data"]
        .iter()
        .collect();

    let db_file = db_dir.join("empresas.mdb");
    let key_file = db_dir.join("master.key");

    // Abrir el archivo ZIP de origen
    let file =
        File::open(&src_path).map_err(|e| format!("Error abriendo el archivo de origen: {}", e))?;

    let mut archive =
        zip::ZipArchive::new(file).map_err(|e| format!("Error leyendo el formato ZIP: {}", e))?;

    let mut found_db = false;

    // Iterar sobre los archivos dentro del ZIP
    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Error accediendo a archivo interno del ZIP: {}", e))?;

        // Extraer y sobrescribir mdb
        if file.name() == "empresas.mdb" || file.name() == "empresas.accdb" {
            let mut out = File::create(&db_file).map_err(|e| {
                format!("Error al sobrescribir empresas.mdb (¿Archivo bloqueado?): {}", e)
            })?;
            std::io::copy(&mut file, &mut out)
                .map_err(|e| format!("Error extrayendo datos a empresas.mdb: {}", e))?;
            found_db = true;
        }

        // Extraer y sobrescribir master.key
        if file.name() == "master.key" {
            let mut out = File::create(&key_file)
                .map_err(|e| format!("Error creando/sobrescribiendo master.key local: {}", e))?;
            std::io::copy(&mut file, &mut out)
                .map_err(|e| format!("Error extrayendo master.key: {}", e))?;
        }
    }

    if !found_db {
        return Err(
            "El archivo ZIP seleccionado no contiene una copia válida de la base de datos.".into(),
        );
    }

    Ok("Copia de seguridad restaurada exitosamente. La Base de Datos ha sido sobrescrita.".into())
}

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
                let db_dir: PathBuf = [&local_app_data, "com.sunat.automation.v1", "data"].iter().collect();
                let db_file = db_dir.join("empresas.mdb");
                
                if !db_file.exists() {
                    let _ = std::fs::create_dir_all(&db_dir);
                    if let Ok(resource_path) = app.path().resolve("data/plantilla.mdb", tauri::path::BaseDirectory::Resource) {
                        if let Err(e) = std::fs::copy(&resource_path, &db_file) {
                            eprintln!("Error auto-generating blank database: {}", e);
                        } else {
                            println!("Blank database (.mdb) successfully deployed to AppData for first-time use.");
                        }
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![export_backup, import_backup])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
