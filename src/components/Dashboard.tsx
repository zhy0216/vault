import type React from 'react';
import { useState } from 'react';
import { Layout } from '@/components/layout';
import { NotesManager } from '@/components/notes';
import { PasswordManager } from '@/components/passwords';
import { SettingsPage } from '@/components/settings';
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
        return <SettingsPage />;
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
