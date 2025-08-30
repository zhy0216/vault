import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, FileText, Settings } from 'lucide-react';
import { Layout } from '@/components/layout';
import { PasswordManager } from '@/components/passwords';
import { NotesManager } from '@/components/notes';
import { useAuth } from '@/contexts/AuthContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

type ViewType = 'home' | 'passwords' | 'notes' | 'settings';

export const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('home');

  const navigateToView = (view: ViewType) => {
    setCurrentView(view);
  };

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onNavigate: navigateToView,
    onLogout: logout,
    currentView,
  });

  const renderContent = () => {
    switch (currentView) {
      case 'passwords':
        return <PasswordManager />;
      case 'notes':
        return <NotesManager />;
      case 'settings':
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <div className="space-y-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Your Vault
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your secure password manager is ready to use.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateToView('passwords')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Key className="h-5 w-5 text-primary" />
                    <CardTitle>Passwords</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your passwords securely
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Store, generate, and organize your passwords with military-grade encryption.
                  </p>
                  <Button className="w-full mt-4" variant="outline">
                    Manage Passwords
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateToView('notes')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Secure Notes</CardTitle>
                  </div>
                  <CardDescription>
                    Store sensitive information safely
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keep your important notes, documents, and sensitive information encrypted.
                  </p>
                  <Button className="w-full mt-4" variant="outline">
                    Manage Notes
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateToView('settings')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <CardTitle>Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Configure your vault preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customize security settings, backup options, and more.
                  </p>
                  <Button className="w-full mt-4" variant="outline">
                    Open Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🎉 Your Vault is Ready!
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                Your password manager is now set up and ready to use. All your data is encrypted 
                locally and never leaves your device. Start by adding your first password or note.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={navigateToView}>
      {renderContent()}
    </Layout>
  );
};
