mod commands;
mod markdown;
mod watcher;

use std::sync::Mutex;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(Mutex::new(watcher::FileWatcher::new()))
        .invoke_handler(tauri::generate_handler![
            commands::file::open_file,
            commands::markdown::parse_markdown,
            watcher::watch_file,
            watcher::unwatch_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
