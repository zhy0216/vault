use tauri::State;
use crate::{AppState, database::Note, services::NotesService};

#[tauri::command]
pub async fn get_notes(state: State<'_, AppState>) -> Result<Vec<Note>, String> {
    let db_manager = state.lock().await;
    NotesService::get_notes(&*db_manager)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_note(note: Note, state: State<'_, AppState>) -> Result<i64, String> {
    let db_manager = state.lock().await;
    NotesService::create_note(&*db_manager, note)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_note(id: i64, note: Note, state: State<'_, AppState>) -> Result<(), String> {
    let db_manager = state.lock().await;
    NotesService::update_note(&*db_manager, id, note)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_note(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let db_manager = state.lock().await;
    NotesService::delete_note(&*db_manager, id)
        .await
        .map_err(|e| e.to_string())
}
