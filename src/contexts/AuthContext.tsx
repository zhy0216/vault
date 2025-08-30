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
    isLoading: true,
  });

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const sessionToken = localStorage.getItem('sessionToken');
      if (sessionToken) {
        const isValid = await authAPI.validateSession(sessionToken);
        if (isValid) {
          setAuthState({
            isAuthenticated: true,
            sessionToken,
            isLoading: false,
          });
          return;
        } else {
          localStorage.removeItem('sessionToken');
        }
      }
      
      setAuthState({
        isAuthenticated: false,
        sessionToken: undefined,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthState({
        isAuthenticated: false,
        sessionToken: undefined,
        isLoading: false,
      });
    }
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const isValid = await authAPI.verifyMasterPassword(password);
      if (isValid) {
        const sessionToken = await authAPI.createSession();
        localStorage.setItem('sessionToken', sessionToken);
        
        setAuthState({
          isAuthenticated: true,
          sessionToken,
          isLoading: false,
        });
        return true;
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
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
        isLoading: false,
      });
    }
  };

  const setupMasterPassword = async (password: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await authAPI.setMasterPassword(password);
      
      // Automatically log in after setup
      await login(password);
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
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
