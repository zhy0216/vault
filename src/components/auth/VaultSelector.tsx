import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderPlus, FolderOpen, Clock, Shield, ArrowLeft } from 'lucide-react';
import { authAPI } from '@/lib/tauri';
import { open } from '@tauri-apps/plugin-dialog';

interface VaultInfo {
  path: string;
  name: string;
  lastAccessed: number;
}

interface VaultSelectorProps {
  onVaultSelected: (vaultPath: string, password: string) => void;
}

interface SetupScreenProps {
  onVaultCreated: (vaultPath: string, password: string) => void;
  onBack: () => void;
}

export const VaultSelector: React.FC<VaultSelectorProps> = ({ onVaultSelected }) => {
  const [recentVaults, setRecentVaults] = useState<VaultInfo[]>([]);
  const [showSetupScreen, setShowSetupScreen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedVaultPath, setSelectedVaultPath] = useState<string>('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecentVaults();
  }, []);

  const loadRecentVaults = () => {
    const stored = localStorage.getItem('recentVaults');
    if (stored) {
      try {
        const vaults = JSON.parse(stored) as VaultInfo[];
        // Sort by last accessed time, most recent first
        vaults.sort((a, b) => b.lastAccessed - a.lastAccessed);
        setRecentVaults(vaults.slice(0, 5)); // Keep only 5 most recent
      } catch (error) {
        console.error('Failed to load recent vaults:', error);
      }
    }
  };

  const addToRecentVaults = (vaultPath: string) => {
    const vaultName = vaultPath.split('/').pop() || 'Unknown Vault';
    const newVault: VaultInfo = {
      path: vaultPath,
      name: vaultName,
      lastAccessed: Date.now()
    };

    const existing = recentVaults.filter(v => v.path !== vaultPath);
    const updated = [newVault, ...existing].slice(0, 5);
    
    setRecentVaults(updated);
    localStorage.setItem('recentVaults', JSON.stringify(updated));
  };

  const handleVaultCreated = async (vaultPath: string, password: string) => {
    console.log('handleVaultCreated called with:', { vaultPath, password: '***' });
    addToRecentVaults(vaultPath);
    // Save as current vault path
    localStorage.setItem('currentVaultPath', vaultPath);
    setShowSetupScreen(false);
    console.log('Calling onVaultSelected...');
    onVaultSelected(vaultPath, password);
  };

  const handleOpenVault = async () => {
    try {
      const selected = await open({
        title: 'Select Vault File',
        filters: [{
          name: 'Vault Database',
          extensions: ['db']
        }],
        multiple: false
      });

      if (selected && typeof selected === 'string') {
        const isValid = await authAPI.isVaultFileValid(selected);
        if (isValid) {
          setSelectedVaultPath(selected);
          setShowPasswordDialog(true);
        } else {
          setError('Selected file is not a valid vault database');
        }
      }
    } catch (error) {
      setError('Failed to open file dialog: ' + error);
    }
  };

  const handleVaultPasswordSubmit = async () => {
    if (!password.trim()) {
      setError('Please enter the vault password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Calling initializeDatabaseWithPath with:', { password: '***', selectedVaultPath });
      const result = await authAPI.initializeDatabaseWithPath(password, selectedVaultPath);
      console.log('initializeDatabaseWithPath result:', result);
      addToRecentVaults(selectedVaultPath);
      // Save as current vault path
      localStorage.setItem('currentVaultPath', selectedVaultPath);
      setShowPasswordDialog(false);
      onVaultSelected(selectedVaultPath, password);
    } catch (error) {
      console.error('initializeDatabaseWithPath error:', error);
      setError('Invalid password or corrupted vault file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecentVaultClick = (vault: VaultInfo) => {
    setSelectedVaultPath(vault.path);
    setShowPasswordDialog(true);
  };

  const resetDialogs = () => {
    setShowPasswordDialog(false);
    setPassword('');
    setSelectedVaultPath('');
    setError('');
  };

  if (showSetupScreen) {
    return (
      <SetupScreenWithVaultCreation
        onVaultCreated={handleVaultCreated}
        onBack={() => setShowSetupScreen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Vault Password Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Secure, encrypted password storage for your peace of mind
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowSetupScreen(true)}>
            <CardHeader className="text-center">
              <FolderPlus className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <CardTitle>Create New Vault</CardTitle>
              <CardDescription>
                Create a new encrypted vault to store your passwords securely
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleOpenVault}>
            <CardHeader className="text-center">
              <FolderOpen className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <CardTitle>Open Existing Vault</CardTitle>
              <CardDescription>
                Browse and open an existing vault file from your computer
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {recentVaults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Vaults
              </CardTitle>
              <CardDescription>
                Quick access to your recently used vaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentVaults.map((vault, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleRecentVaultClick(vault)}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vault.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {vault.path}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(vault.lastAccessed).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Vault Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Vault Password</DialogTitle>
              <DialogDescription>
                Enter the master password for this vault to unlock it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vaultPassword">Master Password</Label>
                <Input
                  id="vaultPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter vault password"
                  onKeyDown={(e) => e.key === 'Enter' && handleVaultPasswordSubmit()}
                />
              </div>
              {selectedVaultPath && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Vault: {selectedVaultPath.split('/').pop()}
                </p>
              )}
              {error && (
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetDialogs}>
                Cancel
              </Button>
              <Button onClick={handleVaultPasswordSubmit} disabled={isLoading}>
                {isLoading ? 'Opening...' : 'Open Vault'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Enhanced SetupScreen component for vault creation
const SetupScreenWithVaultCreation: React.FC<SetupScreenProps> = ({ onVaultCreated, onBack }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Creating new vault with password...');
      const vaultPath = await authAPI.createNewVault(password);
      console.log('Vault created successfully at:', vaultPath);
      onVaultCreated(vaultPath, password);
    } catch (error) {
      console.error('Failed to create vault:', error);
      setError('Failed to create vault. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vault Selection
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-bold text-2xl">
              Create New Vault
            </CardTitle>
            <CardDescription>
              Set a master password for your new vault. This password will encrypt all your data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">Master Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong master password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your master password"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                <p className="text-blue-800 text-sm dark:text-blue-200">
                  <strong>Important:</strong> Your master password cannot be recovered if forgotten. 
                  Make sure to choose something memorable but secure.
                </p>
              </div>
              
              <Button
                className="w-full"
                disabled={!(password && confirmPassword) || isLoading}
                type="submit"
              >
                {isLoading ? 'Creating Vault...' : 'Create Vault'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
