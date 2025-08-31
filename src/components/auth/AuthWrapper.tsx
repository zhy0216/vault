import type React from 'react';
import { memo, useState, useEffect } from 'react';
import { VaultSelector } from './VaultSelector';
import { LoginScreen } from './LoginScreen';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/tauri';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentVaultPath, setCurrentVaultPath] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated, checkAuthStatus } = useAuth();

  useEffect(() => {
    // Check for stored vault path on component mount
    const storedVaultPath = localStorage.getItem('currentVaultPath');
    setCurrentVaultPath(storedVaultPath);
    setIsInitialized(true);
  }, []);

  const handleVaultSelected = async (vaultPath: string, _password: string) => {
    setIsLoading(true);
    try {
      // Store the vault path in localStorage
      localStorage.setItem('currentVaultPath', vaultPath);
      setCurrentVaultPath(vaultPath);
      
      // The vault is already initialized in the VaultSelector component
      // Now we need to create a session to authenticate the user
      const sessionToken = await authAPI.createSession();
      localStorage.setItem('sessionToken', sessionToken);
      
      // Update the auth context to reflect the authenticated state
      await checkAuthStatus();
    } catch (error) {
      console.error('Failed to authenticate after vault selection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeVault = () => {
    // Clear the current vault path to show VaultSelector
    localStorage.removeItem('currentVaultPath');
    localStorage.removeItem('sessionToken');
    setCurrentVaultPath(null);
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          <p className="mt-2 text-gray-600 text-sm dark:text-gray-400">
            Loading vault...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If we have a stored vault path, show LoginScreen, otherwise show VaultSelector
    if (currentVaultPath) {
      return <LoginScreen vaultPath={currentVaultPath} onChangeVault={handleChangeVault} />;
    } else {
      return <VaultSelector onVaultSelected={handleVaultSelected} />;
    }
  }

  return <>{children}</>;
});
