use ring::rand::{SecureRandom, SystemRandom};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

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

    pub async fn set_master_password(&self, password: &str) -> Result<()> {
        // Validate password strength
        self.validate_password_strength(password)?;

        // Create a new encrypted database with this password
        // This will fail if the database already exists and can't be opened with this password
        let _db_manager = DatabaseManager::new_with_encryption(password).await?;

        Ok(())
    }

    pub async fn verify_master_password(&mut self, password: &str) -> Result<bool> {
        let client_id = "default"; // In a real app, this would be based on client identification
        
        // Check if account is locked
        if self.is_account_locked(client_id) {
            return Err(DatabaseError::Migration("Account temporarily locked due to too many failed attempts".to_string()));
        }

        // Try to validate the master password by attempting to create a database manager
        // This is more reliable than just opening the database
        match DatabaseManager::new_with_encryption(password).await {
            Ok(_) => {
                // Reset login attempts on successful login
                self.login_attempts.remove(client_id);
                Ok(true)
            }
            Err(DatabaseError::Connection(_)) => {
                // This likely means wrong password
                self.record_failed_attempt(client_id);
                Ok(false)
            }
            Err(e) => {
                // Other errors should be propagated
                Err(e)
            }
        }
    }

    pub async fn is_master_password_set(&self) -> Result<bool> {
        // Check if the encrypted database file exists
        DatabaseManager::is_database_initialized()
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
