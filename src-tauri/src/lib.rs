mod database;
mod repositories;
mod services;
mod commands;

use database::DatabaseManager;
use services::AuthService;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::Manager;

pub type AppState = Arc<Mutex<DatabaseManager>>;
pub type AuthState = Arc<Mutex<AuthService>>;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let rt = tokio::runtime::Runtime::new().unwrap();
            let db_manager = rt.block_on(async {
                DatabaseManager::new().await.expect("Failed to initialize database")
            });
            
            let auth_service = AuthService::new();
            
            app.manage(Arc::new(Mutex::new(db_manager)));
            app.manage(Arc::new(Mutex::new(auth_service)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::get_passwords,
            commands::create_password,
            commands::update_password,
            commands::delete_password,
            commands::search_passwords,
            commands::get_notes,
            commands::create_note,
            commands::update_note,
            commands::delete_note,
            commands::verify_master_password,
            commands::set_master_password,
            commands::is_master_password_set,
            commands::create_session,
            commands::validate_session,
            commands::lock_session
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
