use crate::database::{DatabaseManager, Note, Result};
use crate::repositories::NotesRepository;

pub struct NotesService;

impl NotesService {
    pub async fn create_note(db_manager: &DatabaseManager, note: Note) -> Result<i64> {
        let conn = db_manager.get_connection().await?;
        NotesRepository::create(&conn, &note).await
    }

    pub async fn get_notes(db_manager: &DatabaseManager) -> Result<Vec<Note>> {
        let conn = db_manager.get_connection().await?;
        NotesRepository::get_all(&conn).await
    }

    pub async fn update_note(db_manager: &DatabaseManager, id: i64, note: Note) -> Result<()> {
        let conn = db_manager.get_connection().await?;
        NotesRepository::update(&conn, id, &note).await
    }

    pub async fn delete_note(db_manager: &DatabaseManager, id: i64) -> Result<()> {
        let conn = db_manager.get_connection().await?;
        NotesRepository::delete(&conn, id).await
    }
}
