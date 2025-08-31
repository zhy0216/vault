import type React from 'react';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { Dashboard } from '@/components/Dashboard';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <AuthWrapper>
        <div />
      </AuthWrapper>
    );
  }

  return <Dashboard />;
};

function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
