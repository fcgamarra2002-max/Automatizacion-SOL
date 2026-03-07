// Configuración Tauri v2 — Registro del plugin shell para sidecar.
// SKILL: Tauri v2 (comandos, plugins, sidecar).

use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zip::{write::FileOptions, ZipWriter};

const APP_DATA_DIR_NAME: &str = "Automatizacion-SOL";
const LEGACY_APP_DATA_DIR_NAME: &str = "com.sunat.automation.v1";
const DB_FILE_NAME: &str = "empresa.db";
const LEGACY_DB_FILE_NAME: &str = "empresas.db";
const TEMPLATE_DB_FILE_NAME: &str = "plantilla.db";

fn current_db_dir(local_app_data: &str) -> PathBuf {
    [local_app_data, APP_DATA_DIR_NAME, "data"].iter().collect()
}

fn legacy_db_dir(local_app_data: &str) -> PathBuf {
    [local_app_data, LEGACY_APP_DATA_DIR_NAME, "data"].iter().collect()
}

fn ensure_db_dir(local_app_data: &str) -> Result<PathBuf, String> {
    let db_dir = current_db_dir(local_app_data);
    std::fs::create_dir_all(&db_dir)
        .map_err(|e| format!("Error creando directorio de datos: {}", e))?;
    Ok(db_dir)
}

fn migrate_legacy_data_if_needed(local_app_data: &str) -> Result<(), String> {
    let db_dir = ensure_db_dir(local_app_data)?;
    let db_file = db_dir.join(DB_FILE_NAME);
    let key_file = db_dir.join("master.key");
    let current_legacy_db = db_dir.join(LEGACY_DB_FILE_NAME);
    let current_template_db = db_dir.join(TEMPLATE_DB_FILE_NAME);

    if !db_file.exists() && current_legacy_db.exists() {
        std::fs::rename(&current_legacy_db, &db_file)
            .or_else(|_| std::fs::copy(&current_legacy_db, &db_file).map(|_| ()))
            .map_err(|e| format!("Error migrando empresa.db desde empresas.db: {}", e))?;
    }

    if current_template_db.exists() {
        let _ = std::fs::remove_file(&current_template_db);
    }

    if db_file.exists() || key_file.exists() {
        return Ok(());
    }

    let legacy_dir = legacy_db_dir(local_app_data);
    let legacy_db = legacy_dir.join(LEGACY_DB_FILE_NAME);
    let legacy_key = legacy_dir.join("master.key");

    if legacy_db.exists() {
        std::fs::copy(&legacy_db, &db_file)
            .map_err(|e| format!("Error migrando base de datos legacy: {}", e))?;
    }

    if legacy_key.exists() {
        std::fs::copy(&legacy_key, &key_file)
            .map_err(|e| format!("Error migrando master.key legacy: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
fn get_storage_paths() -> Result<(String, String, String), String> {
    let local_app_data =
        std::env::var("LOCALAPPDATA").map_err(|e| format!("Error leyendo LOCALAPPDATA: {}", e))?;

    let db_dir = current_db_dir(&local_app_data);
    let db_file = db_dir.join(DB_FILE_NAME);
    let key_file = db_dir.join("master.key");

    Ok((
        db_dir.to_string_lossy().to_string(),
        db_file.to_string_lossy().to_string(),
        key_file.to_string_lossy().to_string(),
    ))
}

#[tauri::command]
fn export_backup(dest_path: String) -> Result<String, String> {
    let local_app_data =
        std::env::var("LOCALAPPDATA").map_err(|e| format!("Error leyendo LOCALAPPDATA: {}", e))?;

    migrate_legacy_data_if_needed(&local_app_data)?;
    let db_dir = ensure_db_dir(&local_app_data)?;

    let db_file = db_dir.join(DB_FILE_NAME);
    let key_file = db_dir.join("master.key");

    if !db_file.exists() {
        return Err(format!("Error: La base de datos ({}) no existe.", DB_FILE_NAME));
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
    zip.start_file(DB_FILE_NAME, options)
        .map_err(|e| format!("Error iniciando entrada ZIP para db: {}", e))?;

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

    migrate_legacy_data_if_needed(&local_app_data)?;
    let db_dir = ensure_db_dir(&local_app_data)?;

    let db_file = db_dir.join(DB_FILE_NAME);
    let key_file = db_dir.join("master.key");

    // Abrir el archivo ZIP de origen
    let file =
        File::open(&src_path).map_err(|e| format!("Error abriendo el archivo de origen: {}", e))?;

    let mut archive =
        zip::ZipArchive::new(file).map_err(|e| format!("Error leyendo el formato ZIP: {}", e))?;

    let mut db_bytes: Option<Vec<u8>> = None;
    let mut key_bytes: Option<Vec<u8>> = None;

    // Iterar sobre los archivos dentro del ZIP
    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Error accediendo a archivo interno del ZIP: {}", e))?;

        if file.name() == DB_FILE_NAME || file.name() == LEGACY_DB_FILE_NAME || file.name() == "empresas.mdb" || file.name() == "empresas.accdb" {
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer)
                .map_err(|e| format!("Error leyendo base de datos desde backup: {}", e))?;
            db_bytes = Some(buffer);
        }

        if file.name() == "master.key" {
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer)
                .map_err(|e| format!("Error leyendo master.key desde backup: {}", e))?;
            key_bytes = Some(buffer);
        }
    }

    let db_bytes = db_bytes.ok_or_else(|| {
        "El archivo ZIP seleccionado no contiene una copia válida de la base de datos.".to_string()
    })?;

    let old_db = if db_file.exists() {
        Some(std::fs::read(&db_file).map_err(|e| format!("Error leyendo DB actual: {}", e))?)
    } else {
        None
    };
    let old_key = if key_file.exists() {
        Some(std::fs::read(&key_file).map_err(|e| format!("Error leyendo master.key actual: {}", e))?)
    } else {
        None
    };

    let write_result: Result<(), String> = (|| {
        std::fs::write(&db_file, &db_bytes)
            .map_err(|e| format!("Error al sobrescribir {} (¿Archivo bloqueado?): {}", DB_FILE_NAME, e))?;

        if let Some(key_data) = key_bytes {
            std::fs::write(&key_file, &key_data)
                .map_err(|e| format!("Error creando/sobrescribiendo master.key local: {}", e))?;
        }

        Ok(())
    })();

    if let Err(error) = write_result {
        if let Some(previous_db) = old_db {
            let _ = std::fs::write(&db_file, previous_db);
        }
        if let Some(previous_key) = old_key {
            let _ = std::fs::write(&key_file, previous_key);
        }
        return Err(error);
    }

    if !db_file.exists() {
        return Err(
            "La restauración no pudo materializar la base de datos en disco.".into(),
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
                let _ = migrate_legacy_data_if_needed(&local_app_data);
                let db_dir: PathBuf = current_db_dir(&local_app_data);
                let db_file = db_dir.join(DB_FILE_NAME);
                
                if !db_file.exists() {
                    let _ = std::fs::create_dir_all(&db_dir);
                    for resource_name in ["data/empresas.db", "data/plantilla.db"] {
                        if let Ok(resource_path) = app.path().resolve(resource_name, tauri::path::BaseDirectory::Resource) {
                            if let Err(e) = std::fs::copy(&resource_path, &db_file) {
                                eprintln!("Error auto-generating blank database from {}: {}", resource_name, e);
                            } else {
                                println!("Blank database (.db) successfully deployed to AppData for first-time use.");
                                break;
                            }
                        }
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![export_backup, import_backup, get_storage_paths])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
