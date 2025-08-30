import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/lib/tauri';
import type { AuthState } from '@/types';
import { useAutoLock } from '@/hooks/useAutoLock';

interface AuthContextType extends AuthState {
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setupMasterPassword: (password: string) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    sessionToken: undefined,
  });

  // Get auto-lock timeout from settings (default: 15 minutes)
  const getAutoLockTimeout = () => {
    try {
      const settings = localStorage.getItem('vault-settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        return parsedSettings.autoLockTimeout || 15;
      }
    } catch (error) {
      console.error('Failed to parse settings for auto-lock:', error);
    }
    return 15; // Default timeout
  };

  const checkAuthStatus = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      if (sessionToken) {
        const isValid = await authAPI.validateSession(sessionToken);
        if (isValid) {
          setAuthState({
            isAuthenticated: true,
            sessionToken,
          });
          return;
        }
        localStorage.removeItem('sessionToken');
      }

      setAuthState({
        isAuthenticated: false,
        sessionToken: undefined,
      });
    } catch (_error) {
      setAuthState({
        isAuthenticated: false,
        sessionToken: undefined,
      });
    }
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      const isValid = await authAPI.verifyMasterPassword(password);

      if (isValid) {
        // Initialize the encrypted database with the master password
        await authAPI.initializeDatabase(password);
        
        const sessionToken = await authAPI.createSession();
        localStorage.setItem('sessionToken', sessionToken);

        setAuthState({
          isAuthenticated: true,
          sessionToken,
        });
        return true;
      }
      return false;
    } catch (_error) {
      return false;
    }
  };

  const logout = async () => {
    try {
      const sessionToken =
        authState.sessionToken || localStorage.getItem('sessionToken');
      if (sessionToken) {
        await authAPI.lockSession(sessionToken);
        localStorage.removeItem('sessionToken');
      }
    } catch (_error) {
    } finally {
      setAuthState({
        isAuthenticated: false,
        sessionToken: undefined,
      });
    }
  };

  // Setup auto-lock functionality
  useAutoLock({
    timeout: getAutoLockTimeout(),
    onLock: logout,
    isAuthenticated: authState.isAuthenticated,
  });

  const setupMasterPassword = async (password: string): Promise<void> => {
    await authAPI.setMasterPassword(password);
    
    // Initialize the encrypted database with the new master password
    await authAPI.initializeDatabase(password);

    // Automatically log in after setup
    await login(password);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    setupMasterPassword,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
