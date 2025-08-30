import type React from 'react';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { Dashboard } from '@/components/Dashboard';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
