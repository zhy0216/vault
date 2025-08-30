import React, { useEffect, useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { SetupScreen } from './SetupScreen';
import { authAPI } from '@/lib/tauri';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const isMasterPasswordSet = await authAPI.isMasterPasswordSet();
        setIsSetup(isMasterPasswordSet);
      } catch (error) {
        console.error('Failed to check setup status:', error);
        setIsSetup(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSetupStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSetup === false) {
    return <SetupScreen />;
  }

  return <LoginScreen />;
};
