import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';

type ViewType = 'home' | 'passwords' | 'notes' | 'settings';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onNavigate,
}) => {
  const [darkMode, setDarkMode] = useState(false);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('vault-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setDarkMode(shouldUseDark);
    
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vault-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vault-theme', 'light');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex">
      <Navigation
        currentView={currentView}
        onNavigate={onNavigate}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-in fade-in-50 duration-200">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
