import { Settings } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Layout } from '@/components/layout';
import { NotesManager } from '@/components/notes';
import { PasswordManager } from '@/components/passwords';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

type ViewType = 'passwords' | 'notes' | 'settings';

export const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('passwords');

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
              <Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">Settings</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        );
      default:
        return <PasswordManager />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={navigateToView}>
      {renderContent()}
    </Layout>
  );
};
