use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use ring::rand::{SecureRandom, SystemRandom};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use zeroize::Zeroize;

use crate::database::{DatabaseError, DatabaseManager, Result};

const SESSION_TIMEOUT_MINUTES: u64 = 15;
const MAX_LOGIN_ATTEMPTS: u32 = 5;
const LOCKOUT_DURATION_MINUTES: u64 = 30;

pub struct AuthService {
    sessions: HashMap<String, SessionInfo>,
    login_attempts: HashMap<String, LoginAttemptInfo>,
}

#[derive(Debug, Clone)]
struct SessionInfo {
    created_at: u64,
    last_activity: u64,
}

#[derive(Debug, Clone)]
struct LoginAttemptInfo {
    attempts: u32,
    last_attempt: u64,
    locked_until: Option<u64>,
}

impl AuthService {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
            login_attempts: HashMap::new(),
        }
    }

    pub async fn set_master_password(&self, db_manager: &DatabaseManager, password: &str) -> Result<()> {
        // Validate password strength
        self.validate_password_strength(password)?;

        // Hash the password
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| DatabaseError::Migration(format!("Failed to hash password: {}", e)))?;

        // Store the hash in the database
        let conn = db_manager.get_connection().await?;
        conn.execute(
            "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
            ("master_password_hash", password_hash.to_string().as_str()),
        )
        .await
        .map_err(|e| DatabaseError::Query(format!("Failed to store master password: {}", e)))?;

        Ok(())
    }

    pub async fn verify_master_password(&mut self, db_manager: &DatabaseManager, password: &str) -> Result<bool> {
        let client_id = "default"; // In a real app, this would be based on client identification
        
        // Check if account is locked
        if self.is_account_locked(client_id) {
            return Err(DatabaseError::Migration("Account temporarily locked due to too many failed attempts".to_string()));
        }

        // Get stored password hash
        let conn = db_manager.get_connection().await?;
        let mut rows = conn
            .query(
                "SELECT value FROM config WHERE key = ?",
                ["master_password_hash"],
            )
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to get master password hash: {}", e)))?;

        if let Some(row) = rows.next().await.map_err(|e| DatabaseError::Query(format!("Failed to read config row: {}", e)))? {
            let stored_hash = row.get::<String>(0)?;
            let parsed_hash = PasswordHash::new(&stored_hash)
                .map_err(|e| DatabaseError::Migration(format!("Invalid password hash format: {}", e)))?;

            let argon2 = Argon2::default();
            let is_valid = argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok();

            if is_valid {
                // Reset login attempts on successful login
                self.login_attempts.remove(client_id);
                Ok(true)
            } else {
                // Record failed attempt
                self.record_failed_attempt(client_id);
                Ok(false)
            }
        } else {
            // No master password set yet
            Ok(false)
        }
    }

    pub async fn is_master_password_set(&self, db_manager: &DatabaseManager) -> Result<bool> {
        let conn = db_manager.get_connection().await?;
        let mut rows = conn
            .query(
                "SELECT COUNT(*) FROM config WHERE key = ?",
                ["master_password_hash"],
            )
            .await
            .map_err(|e| DatabaseError::Query(format!("Failed to check master password: {}", e)))?;

        if let Some(row) = rows.next().await.map_err(|e| DatabaseError::Query(format!("Failed to read config row: {}", e)))? {
            let count: i64 = row.get(0)?;
            Ok(count > 0)
        } else {
            Ok(false)
        }
    }

    pub fn create_session(&mut self) -> Result<String> {
        let session_token = self.generate_session_token()?;
        let now = self.current_timestamp();
        
        self.sessions.insert(session_token.clone(), SessionInfo {
            created_at: now,
            last_activity: now,
        });

        Ok(session_token)
    }

    pub fn validate_session(&mut self, token: &str) -> Result<bool> {
        let now = self.current_timestamp();
        
        if let Some(session) = self.sessions.get_mut(token) {
            // Check if session has expired
            if now - session.last_activity > SESSION_TIMEOUT_MINUTES * 60 {
                self.sessions.remove(token);
                return Ok(false);
            }

            // Update last activity
            session.last_activity = now;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub fn lock_session(&mut self, token: &str) -> Result<()> {
        self.sessions.remove(token);
        Ok(())
    }

    fn validate_password_strength(&self, password: &str) -> Result<()> {
        if password.len() < 8 {
            return Err(DatabaseError::Migration("Password must be at least 8 characters long".to_string()));
        }

        let has_letter = password.chars().any(|c| c.is_alphabetic());
        let has_number = password.chars().any(|c| c.is_numeric());

        if !has_letter || !has_number {
            return Err(DatabaseError::Migration("Password must contain both letters and numbers".to_string()));
        }

        Ok(())
    }

    fn generate_session_token(&self) -> Result<String> {
        let rng = SystemRandom::new();
        let mut token_bytes = [0u8; 32];
        rng.fill(&mut token_bytes)
            .map_err(|e| DatabaseError::Migration(format!("Failed to generate session token: {:?}", e)))?;
        
        Ok(hex::encode(token_bytes))
    }

    fn current_timestamp(&self) -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }

    fn is_account_locked(&self, client_id: &str) -> bool {
        if let Some(attempt_info) = self.login_attempts.get(client_id) {
            if let Some(locked_until) = attempt_info.locked_until {
                return self.current_timestamp() < locked_until;
            }
        }
        false
    }

    fn record_failed_attempt(&mut self, client_id: &str) {
        let now = self.current_timestamp();
        let attempt_info = self.login_attempts.entry(client_id.to_string()).or_insert(LoginAttemptInfo {
            attempts: 0,
            last_attempt: now,
            locked_until: None,
        });

        attempt_info.attempts += 1;
        attempt_info.last_attempt = now;

        if attempt_info.attempts >= MAX_LOGIN_ATTEMPTS {
            attempt_info.locked_until = Some(now + LOCKOUT_DURATION_MINUTES * 60);
        }
    }
}
