import type React from 'react';
import { memo, useEffect, useState } from 'react';
import { authAPI } from '@/lib/tauri';
import { LoginScreen } from './LoginScreen';
import { SetupScreen } from './SetupScreen';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = memo(() => {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const isMasterPasswordSet = await authAPI.isMasterPasswordSet();
        setIsSetup(isMasterPasswordSet);
      } catch (_error) {
        setIsSetup(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSetupStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          <p className="mt-2 text-gray-600 text-sm dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (isSetup === false) {
    return <SetupScreen />;
  }

  return <LoginScreen />;
});
