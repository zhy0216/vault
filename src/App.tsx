import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { Dashboard } from '@/components/Dashboard';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthWrapper><div /></AuthWrapper>;
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
