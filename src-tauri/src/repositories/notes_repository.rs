use libsql::Connection;
use crate::database::{DatabaseError, Result, Note};

pub struct NotesRepository;

impl NotesRepository {
    pub async fn create(conn: &Connection, note: &Note) -> Result<i64> {
        let result = conn
            .execute(
                "INSERT INTO notes (title, content) VALUES (?, ?)",
                (note.title.as_str(), note.content.as_str()),
            )
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to create note: {}", e)))?;

        Ok(result as i64)
    }

    pub async fn get_all(conn: &Connection) -> Result<Vec<Note>> {
        let mut rows = conn
            .query(
                "SELECT id, title, content, created_at, updated_at FROM notes ORDER BY created_at DESC",
                (),
            )
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to get notes: {}", e)))?;

        let mut notes = Vec::new();
        while let Some(row) = rows.next().await.map_err(|e| DatabaseError::Query(format!("Failed to read note row: {}", e)))? {
            notes.push(Note {
                id: Some(row.get::<i64>(0)?),
                title: row.get::<String>(1)?,
                content: row.get::<String>(2)?,
                created_at: row.get::<Option<String>>(3)?,
                updated_at: row.get::<Option<String>>(4)?,
            });
        }

        Ok(notes)
    }

    pub async fn get_by_id(conn: &Connection, id: i64) -> Result<Option<Note>> {
        let mut rows = conn
            .query(
                "SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?",
                [id],
            )
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to get note by id: {}", e)))?;

        if let Some(row) = rows.next().await.map_err(|e| DatabaseError::Query(format!("Failed to read note row: {}", e)))? {
            Ok(Some(Note {
                id: Some(row.get::<i64>(0)?),
                title: row.get::<String>(1)?,
                content: row.get::<String>(2)?,
                created_at: row.get::<Option<String>>(3)?,
                updated_at: row.get::<Option<String>>(4)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn update(conn: &Connection, id: i64, note: &Note) -> Result<()> {
        conn.execute(
            "UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (note.title.as_str(), note.content.as_str(), id),
        )
        .await
        .map_err(|e| DatabaseError::Query(format!("Failed to update note: {}", e)))?;

        Ok(())
    }

    pub async fn delete(conn: &Connection, id: i64) -> Result<()> {
        conn.execute("DELETE FROM notes WHERE id = ?", [id])
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to delete note: {}", e)))?;

        Ok(())
    }
}
