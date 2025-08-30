use libsql::Connection;
use crate::database::{DatabaseError, Result};

const MIGRATIONS: &[&str] = &[
    // Migration 1: Create initial tables
    r#"
    CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    "#,
    r#"
    CREATE TABLE IF NOT EXISTS passwords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        website TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    "#,
    r#"
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    "#,
    // Migration 2: Create indexes
    r#"
    CREATE INDEX IF NOT EXISTS idx_passwords_website ON passwords(website);
    "#,
    r#"
    CREATE INDEX IF NOT EXISTS idx_passwords_username ON passwords(username);
    "#,
    r#"
    CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
    "#,
    // Migration 3: Create schema version table
    r#"
    CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    "#,
];

pub async fn run_migrations(conn: &Connection) -> Result<()> {
    // Create schema_version table first if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        (),
    )
    .await
    .map_err(|e| DatabaseError::Migration(format!("Failed to create schema_version table: {}", e)))?;

    // Get current schema version
    let current_version = get_current_version(conn).await?;
    
    // Apply migrations that haven't been applied yet
    for (index, migration) in MIGRATIONS.iter().enumerate() {
        let version = index as i64 + 1;
        
        if version > current_version {
            println!("Applying migration {}", version);
            
            conn.execute(migration, ())
                .await
                .map_err(|e| DatabaseError::Migration(format!("Failed to apply migration {}: {}", version, e)))?;
            
            // Record that this migration was applied
            conn.execute(
                "INSERT OR REPLACE INTO schema_version (version) VALUES (?)",
                [version],
            )
            .await
            .map_err(|e| DatabaseError::Migration(format!("Failed to record migration {}: {}", version, e)))?;
        }
    }
    
    Ok(())
}

async fn get_current_version(conn: &Connection) -> Result<i64> {
    let mut rows = conn
        .query("SELECT MAX(version) as version FROM schema_version", ())
        .await
        .map_err(|e| DatabaseError::Query(format!("Failed to get current version: {}", e)))?;
    
    if let Some(row) = rows.next().await.map_err(|e| DatabaseError::Query(format!("Failed to read version row: {}", e)))? {
        Ok(row.get::<i64>(0).unwrap_or(0))
    } else {
        Ok(0)
    }
}
