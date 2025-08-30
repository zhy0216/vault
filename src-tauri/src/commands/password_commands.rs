use tauri::State;
use crate::{AppState, database::PasswordEntry, services::PasswordService};

#[tauri::command]
pub async fn get_passwords(state: State<'_, AppState>) -> Result<Vec<PasswordEntry>, String> {
    let db_manager = state.lock().await;
    PasswordService::get_passwords(&*db_manager)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_password(entry: PasswordEntry, state: State<'_, AppState>) -> Result<i64, String> {
    let db_manager = state.lock().await;
    PasswordService::create_password(&*db_manager, entry)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_password(id: i64, entry: PasswordEntry, state: State<'_, AppState>) -> Result<(), String> {
    let db_manager = state.lock().await;
    PasswordService::update_password(&*db_manager, id, entry)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_password(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let db_manager = state.lock().await;
    PasswordService::delete_password(&*db_manager, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_passwords(query: String, state: State<'_, AppState>) -> Result<Vec<PasswordEntry>, String> {
    let db_manager = state.lock().await;
    PasswordService::search_passwords(&*db_manager, &query)
        .await
        .map_err(|e| e.to_string())
}
