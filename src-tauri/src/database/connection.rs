use libsql::{Connection, Database, Builder};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("Database connection error: {0}")]
    Connection(#[from] libsql::Error),
    #[error("Migration error: {0}")]
    Migration(String),
    #[error("Query error: {0}")]
    Query(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

pub type Result<T> = std::result::Result<T, DatabaseError>;

pub struct DatabaseManager {
    db: Database,
}

impl DatabaseManager {
    pub async fn new() -> Result<Self> {
        let db_path = Self::get_database_path()?;
        
        // Ensure the directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let db = Builder::new_local(db_path.to_string_lossy().to_string())
            .build()
            .await
            .map_err(DatabaseError::Connection)?;

        let manager = Self { db };
        
        // Run migrations on initialization
        manager.run_migrations().await?;
        
        Ok(manager)
    }

    pub async fn get_connection(&self) -> Result<Connection> {
        self.db.connect().map_err(DatabaseError::Connection)
    }

    fn get_database_path() -> Result<PathBuf> {
        let mut path = dirs::data_dir()
            .ok_or_else(|| DatabaseError::Migration("Could not find data directory".to_string()))?;
        
        path.push("vault");
        path.push("vault.db");
        
        Ok(path)
    }

    async fn run_migrations(&self) -> Result<()> {
        let conn = self.get_connection().await?;
        crate::database::migrations::run_migrations(&conn).await
    }
}
