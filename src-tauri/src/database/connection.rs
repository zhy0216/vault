use libsql::{Connection, Database, Builder, EncryptionConfig, Cipher};
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
    #[error("Invalid master password")]
    InvalidMasterPassword,
    #[error("Master password not set")]
    MasterPasswordNotSet,
}

pub type Result<T> = std::result::Result<T, DatabaseError>;

pub struct DatabaseManager {
    db: Database,
}

impl DatabaseManager {
    pub async fn new() -> Result<Self> {
        return Err(DatabaseError::MasterPasswordNotSet);
    }

    pub async fn new_with_encryption(master_password: &str) -> Result<Self> {
        let db_path = Self::get_database_path()?;
        
        // Ensure the directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        // Create encryption key from master password
        let encryption_key = Self::derive_encryption_key(master_password);
        let encryption_config = EncryptionConfig::new(Cipher::Aes256Cbc, encryption_key.into());

        let db = Builder::new_local(db_path.to_string_lossy().to_string())
            .encryption_config(encryption_config)
            .build()
            .await
            .map_err(|e| {
                // If we can't open the database, it might be due to wrong password or corruption
                eprintln!("Database connection error: {:?}", e);
                DatabaseError::Connection(e)
            })?;

        let manager = Self { db };
        
        // Run migrations on initialization
        manager.run_migrations().await?;
        
        Ok(manager)
    }


    pub fn is_database_initialized() -> Result<bool> {
        let db_path = Self::get_database_path()?;
        Ok(db_path.exists())
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

    fn derive_encryption_key(master_password: &str) -> Vec<u8> {
        use sha2::{Sha256, Digest};
        
        // Create a deterministic key from the master password
        let mut hasher = Sha256::new();
        hasher.update(master_password.as_bytes());
        hasher.update(b"vault-encryption-key-salt"); // Add a salt for security
        let hash = hasher.finalize();
        
        // Return the raw bytes for libsql
        hash.to_vec()
    }

    async fn run_migrations(&self) -> Result<()> {
        let conn = self.get_connection().await?;
        crate::database::migrations::run_migrations(&conn).await
    }
}
