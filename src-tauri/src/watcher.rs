use notify_debouncer_mini::{new_debouncer, DebouncedEventKind};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

pub struct FileWatcher {
    watcher: Option<notify_debouncer_mini::Debouncer<notify::RecommendedWatcher>>,
    watched_path: Option<PathBuf>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self {
            watcher: None,
            watched_path: None,
        }
    }
}

#[tauri::command]
pub fn watch_file(path: String, app: AppHandle) -> Result<(), String> {
    let state = app.state::<Mutex<FileWatcher>>();
    let mut watcher_state = state.lock().map_err(|e| e.to_string())?;

    // Stop existing watcher
    watcher_state.watcher = None;
    watcher_state.watched_path = None;

    let file_path = PathBuf::from(&path);
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    let app_handle = app.clone();
    let watched_path = file_path.clone();

    let mut debouncer = new_debouncer(Duration::from_millis(300), move |res: Result<Vec<notify_debouncer_mini::DebouncedEvent>, notify::Error>| {
        match res {
            Ok(events) => {
                let relevant = events.iter().any(|e| e.kind == DebouncedEventKind::Any);
                if relevant {
                    let _ = app_handle.emit("file-changed", watched_path.to_string_lossy().to_string());
                }
            }
            Err(e) => {
                eprintln!("Watch error: {}", e);
            }
        }
    }).map_err(|e| format!("Failed to create watcher: {}", e))?;

    // Watch the parent directory (more reliable than watching the file directly)
    let watch_target = file_path.parent().unwrap_or(&file_path);
    debouncer
        .watcher()
        .watch(watch_target, notify::RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch: {}", e))?;

    watcher_state.watcher = Some(debouncer);
    watcher_state.watched_path = Some(file_path);

    Ok(())
}

#[tauri::command]
pub fn unwatch_file(app: AppHandle) -> Result<(), String> {
    let state = app.state::<Mutex<FileWatcher>>();
    let mut watcher_state = state.lock().map_err(|e| e.to_string())?;
    watcher_state.watcher = None;
    watcher_state.watched_path = None;
    Ok(())
}
