use std::fs;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn open_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file '{}': {}", path, e))
}

#[tauri::command]
pub fn save_file(path: String, content: String, app: AppHandle) -> Result<(), String> {
    let guard = app.state::<Arc<AtomicBool>>();
    guard.store(true, Ordering::SeqCst);
    fs::write(&path, &content).map_err(|e| format!("Failed to write file '{}': {}", path, e))
}
