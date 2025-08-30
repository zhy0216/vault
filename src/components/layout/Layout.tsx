import type React from 'react';
import { useEffect, useState } from 'react';
import { Navigation } from './Navigation';

type ViewType = 'home' | 'passwords' | 'notes' | 'settings';

type LayoutProps = {
  children: React.ReactNode;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onNavigate,
}) => {
  const [darkMode, setDarkMode] = useState(false);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('vault-theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
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
    <div className="flex min-h-screen bg-gray-50 transition-colors dark:bg-gray-900">
      <Navigation
        currentView={currentView}
        darkMode={darkMode}
        onNavigate={onNavigate}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="ml-64 flex flex-1 flex-col">
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="fade-in-50 animate-in duration-200">{children}</div>
        </main>
      </div>
    </div>
  );
};
