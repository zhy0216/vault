use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{AppState, services::AuthService};

pub type AuthState = Arc<Mutex<AuthService>>;

#[tauri::command]
pub async fn verify_master_password(
    password: String, 
    db_state: State<'_, AppState>,
    auth_state: State<'_, AuthState>
) -> Result<bool, String> {
    let db_manager = db_state.lock().await;
    let mut auth_service = auth_state.lock().await;
    
    auth_service.verify_master_password(&*db_manager, &password)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_master_password(
    password: String,
    db_state: State<'_, AppState>,
    auth_state: State<'_, AuthState>
) -> Result<(), String> {
    let db_manager = db_state.lock().await;
    let auth_service = auth_state.lock().await;
    
    auth_service.set_master_password(&*db_manager, &password)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn is_master_password_set(
    db_state: State<'_, AppState>,
    auth_state: State<'_, AuthState>
) -> Result<bool, String> {
    let db_manager = db_state.lock().await;
    let auth_service = auth_state.lock().await;
    
    auth_service.is_master_password_set(&*db_manager)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_session(
    auth_state: State<'_, AuthState>
) -> Result<String, String> {
    let mut auth_service = auth_state.lock().await;
    
    auth_service.create_session()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn validate_session(
    token: String,
    auth_state: State<'_, AuthState>
) -> Result<bool, String> {
    let mut auth_service = auth_state.lock().await;
    
    auth_service.validate_session(&token)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lock_session(
    token: String,
    auth_state: State<'_, AuthState>
) -> Result<(), String> {
    let mut auth_service = auth_state.lock().await;
    
    auth_service.lock_session(&token)
        .map_err(|e| e.to_string())
}
