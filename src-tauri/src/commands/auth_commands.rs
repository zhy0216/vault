use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{AppState, services::AuthService, database::DatabaseManager};

pub type AuthState = Arc<Mutex<AuthService>>;

// Password verification is now handled per-vault in VaultSelector component

// Master password setting is now handled per-vault in VaultSelector component

// No longer needed - vault selection system handles this

// Replaced by initialize_database_with_path which requires explicit vault path

#[tauri::command]
pub async fn initialize_database_with_path(
    password: String,
    vaultPath: String,
    db_state: State<'_, AppState>
) -> Result<(), String> {
    println!("initialize_database_with_path called with path: {}", vaultPath);
    
    // Create the encrypted database with specified path
    let db_manager = DatabaseManager::new_with_encryption_and_path(&password, &vaultPath)
        .await
        .map_err(|e| {
            println!("Database creation error: {}", e);
            e.to_string()
        })?;
    
    println!("Database manager created successfully");
    
    // Update the app state with the new database manager
    let mut db_state_guard = db_state.lock().await;
    *db_state_guard = Some(db_manager);
    
    println!("App state updated successfully");
    Ok(())
}

#[tauri::command]
pub async fn create_new_vault(
    password: String,
    db_state: State<'_, AppState>
) -> Result<String, String> {
    // Create a new vault with timestamp
    let vault_path = DatabaseManager::create_vault_with_timestamp()
        .map_err(|e| e.to_string())?;
    
    // Create the encrypted database
    let db_manager = DatabaseManager::new_with_encryption_and_path(&password, &vault_path.to_string_lossy())
        .await
        .map_err(|e| e.to_string())?;
    
    // Update the app state with the new database manager
    let mut db_state_guard = db_state.lock().await;
    *db_state_guard = Some(db_manager);
    
    Ok(vault_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_vault_directory() -> Result<String, String> {
    DatabaseManager::get_vault_directory()
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn is_vault_file_valid(vault_path: String) -> Result<bool, String> {
    Ok(DatabaseManager::is_vault_file_valid(&vault_path))
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
