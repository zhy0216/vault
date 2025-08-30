use libsql::Connection;
use crate::database::{DatabaseError, Result, PasswordEntry};

pub struct PasswordRepository;

impl PasswordRepository {
    pub async fn create(conn: &Connection, entry: &PasswordEntry) -> Result<i64> {
        let result = conn
            .execute(
                "INSERT INTO passwords (website, username, password, notes) VALUES (?, ?, ?, ?)",
                (
                    entry.website.as_str(),
                    entry.username.as_str(),
                    entry.password.as_str(),
                    entry.notes.as_deref(),
                ),
            )
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to create password entry: {}", e)))?;

        Ok(result as i64)
    }

    pub async fn get_all(conn: &Connection) -> Result<Vec<PasswordEntry>> {
        let mut rows = conn
            .query(
                "SELECT id, website, username, password, notes, created_at, updated_at FROM passwords ORDER BY created_at DESC",
                (),
            )
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to get passwords: {}", e)))?;

        let mut passwords = Vec::new();
        while let Some(row) = rows.next().await.map_err(|e| DatabaseError::Query(format!("Failed to read password row: {}", e)))? {
            passwords.push(PasswordEntry {
                id: Some(row.get::<i64>(0)?),
                website: row.get::<String>(1)?,
                username: row.get::<String>(2)?,
                password: row.get::<String>(3)?,
                notes: row.get::<Option<String>>(4)?,
                created_at: row.get::<Option<String>>(5)?,
                updated_at: row.get::<Option<String>>(6)?,
            });
        }

        Ok(passwords)
    }

    pub async fn get_by_id(conn: &Connection, id: i64) -> Result<Option<PasswordEntry>> {
        let mut rows = conn
            .query(
                "SELECT id, website, username, password, notes, created_at, updated_at FROM passwords WHERE id = ?",
                [id],
            )
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to get password by id: {}", e)))?;

        if let Some(row) = rows.next().await.map_err(|e| DatabaseError::Query(format!("Failed to read password row: {}", e)))? {
            Ok(Some(PasswordEntry {
                id: Some(row.get::<i64>(0)?),
                website: row.get::<String>(1)?,
                username: row.get::<String>(2)?,
                password: row.get::<String>(3)?,
                notes: row.get::<Option<String>>(4)?,
                created_at: row.get::<Option<String>>(5)?,
                updated_at: row.get::<Option<String>>(6)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn update(conn: &Connection, id: i64, entry: &PasswordEntry) -> Result<()> {
        conn.execute(
            "UPDATE passwords SET website = ?, username = ?, password = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (
                entry.website.as_str(),
                entry.username.as_str(),
                entry.password.as_str(),
                entry.notes.as_deref(),
                id,
            ),
        )
        .await
        .map_err(|e| DatabaseError::Query(format!("Failed to update password: {}", e)))?;

        Ok(())
    }

    pub async fn delete(conn: &Connection, id: i64) -> Result<()> {
        conn.execute("DELETE FROM passwords WHERE id = ?", [id])
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to delete password: {}", e)))?;

        Ok(())
    }

    pub async fn search(conn: &Connection, query: &str) -> Result<Vec<PasswordEntry>> {
        let search_pattern = format!("%{}%", query);
        let mut rows = conn
            .query(
                "SELECT id, website, username, password, notes, created_at, updated_at FROM passwords 
                 WHERE website LIKE ? OR username LIKE ? 
                 ORDER BY created_at DESC",
                (search_pattern.as_str(), search_pattern.as_str()),
            )
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to search passwords: {}", e)))?;

        let mut passwords = Vec::new();
        while let Some(row) = rows.next().await.map_err(|e| DatabaseError::Query(format!("Failed to read password row: {}", e)))? {
            passwords.push(PasswordEntry {
                id: Some(row.get::<i64>(0)?),
                website: row.get::<String>(1)?,
                username: row.get::<String>(2)?,
                password: row.get::<String>(3)?,
                notes: row.get::<Option<String>>(4)?,
                created_at: row.get::<Option<String>>(5)?,
                updated_at: row.get::<Option<String>>(6)?,
            });
        }

        Ok(passwords)
    }
}
