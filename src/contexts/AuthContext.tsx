import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/lib/tauri';
import { AuthState } from '@/types';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    sessionToken: undefined,
  });

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
        } else {
          localStorage.removeItem('sessionToken');
        }
      }
      
      setAuthState({
        isAuthenticated: false,
        sessionToken: undefined,
      });
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthState({
        isAuthenticated: false,
        sessionToken: undefined,
      });
    }
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      
      console.log('Attempting to verify password...'); // Debug log
      const isValid = await authAPI.verifyMasterPassword(password);
      console.log('Password verification result:', isValid); // Debug log
      
      if (isValid) {
        const sessionToken = await authAPI.createSession();
        localStorage.setItem('sessionToken', sessionToken);
        
        setAuthState({
          isAuthenticated: true,
          sessionToken,
        });
        return true;
      } else {
        console.log('Password invalid'); // Debug log
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const sessionToken = authState.sessionToken || localStorage.getItem('sessionToken');
      if (sessionToken) {
        await authAPI.lockSession(sessionToken);
        localStorage.removeItem('sessionToken');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        sessionToken: undefined,
      });
    }
  };

  const setupMasterPassword = async (password: string): Promise<void> => {
    try {
      await authAPI.setMasterPassword(password);
      
      // Automatically log in after setup
      await login(password);
    } catch (error) {
      throw error;
    }
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
