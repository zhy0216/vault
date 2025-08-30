use crate::database::{DatabaseManager, PasswordEntry, Result};
use crate::repositories::PasswordRepository;

pub struct PasswordService;

impl PasswordService {
    pub async fn create_password(db_manager: &DatabaseManager, entry: PasswordEntry) -> Result<i64> {
        let conn = db_manager.get_connection().await?;
        PasswordRepository::create(&conn, &entry).await
    }

    pub async fn get_passwords(db_manager: &DatabaseManager) -> Result<Vec<PasswordEntry>> {
        let conn = db_manager.get_connection().await?;
        PasswordRepository::get_all(&conn).await
    }

    pub async fn update_password(db_manager: &DatabaseManager, id: i64, entry: PasswordEntry) -> Result<()> {
        let conn = db_manager.get_connection().await?;
        PasswordRepository::update(&conn, id, &entry).await
    }

    pub async fn delete_password(db_manager: &DatabaseManager, id: i64) -> Result<()> {
        let conn = db_manager.get_connection().await?;
        PasswordRepository::delete(&conn, id).await
    }

    pub async fn search_passwords(db_manager: &DatabaseManager, query: &str) -> Result<Vec<PasswordEntry>> {
        let conn = db_manager.get_connection().await?;
        PasswordRepository::search(&conn, query).await
    }
}
