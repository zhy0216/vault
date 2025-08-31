import { Eye, EyeOff, Lock, FolderOpen } from 'lucide-react';
import type React from 'react';
import { memo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/tauri';

interface LoginScreenProps {
  vaultPath?: string;
  onChangeVault?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = memo(({ vaultPath, onChangeVault }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  console.log("######### LoginScreen vaultPath:", vaultPath);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError('Please enter your master password');
      return;
    }

    if (isSubmitting) {
      return; // Prevent multiple submissions
    }

    setIsSubmitting(true);
    setError(''); // Clear any previous errors

    try {
      if (vaultPath) {
        // Initialize the database with the stored vault path
        await authAPI.initializeDatabaseWithPath(password, vaultPath);
        // Create session after successful vault initialization
        const success = await login(password);
        if (!success) {
          setError('Invalid master password. Please try again.');
          setPassword('');
        }
      } else {
        // No vault path - should redirect to vault selection
        setError('No vault selected. Please select a vault first.');
      }
    } catch (error) {
      // Extract the actual error message from the backend
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An error occurred while logging in. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-bold text-2xl">Welcome to Vault</CardTitle>
          <CardDescription>
            Enter your master password to unlock your vault
          </CardDescription>
          {vaultPath && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Vault: {vaultPath.split('/').pop()}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">Master Password</Label>
              <div className="relative">
                <Input
                  className="pr-10"
                  disabled={isSubmitting}
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <Button
                  className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                  disabled={isSubmitting}
                  onClick={() => setShowPassword(!showPassword)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="border-2 border-red-500" variant="destructive">
                <AlertDescription className="font-semibold text-red-700 dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Unlocking...' : 'Unlock Vault'}
            </Button>
            
            {onChangeVault && (
              <Button 
                variant="outline" 
                className="w-full mt-2" 
                onClick={onChangeVault}
                disabled={isSubmitting}
                type="button"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Change Vault
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
});
