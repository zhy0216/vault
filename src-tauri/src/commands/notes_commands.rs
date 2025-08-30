use tauri::State;
use crate::{AppState, database::Note, services::NotesService};

#[tauri::command]
pub async fn get_notes(state: State<'_, AppState>) -> Result<Vec<Note>, String> {
    let db_manager_opt = state.lock().await;
    let db_manager = db_manager_opt.as_ref().ok_or("Database not initialized")?;
    NotesService::get_notes(db_manager)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_note(note: Note, state: State<'_, AppState>) -> Result<i64, String> {
    let db_manager_opt = state.lock().await;
    let db_manager = db_manager_opt.as_ref().ok_or("Database not initialized")?;
    NotesService::create_note(db_manager, note)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_note(id: i64, note: Note, state: State<'_, AppState>) -> Result<(), String> {
    let db_manager_opt = state.lock().await;
    let db_manager = db_manager_opt.as_ref().ok_or("Database not initialized")?;
    NotesService::update_note(db_manager, id, note)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_note(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let db_manager_opt = state.lock().await;
    let db_manager = db_manager_opt.as_ref().ok_or("Database not initialized")?;
    NotesService::delete_note(db_manager, id)
        .await
        .map_err(|e| e.to_string())
}
