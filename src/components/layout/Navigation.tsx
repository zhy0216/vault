import React from 'react';
import { Button } from '@/components/ui/button';
import { Key, FileText, Settings, LogOut, Home, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type ViewType = 'home' | 'passwords' | 'notes' | 'settings';

interface NavigationProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  darkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  darkMode = false,
  onToggleTheme,
}) => {
  const { logout } = useAuth();

  const navigationItems = [
    {
      id: 'home' as ViewType,
      label: 'Home',
      icon: Home,
      description: 'Dashboard overview',
    },
    {
      id: 'passwords' as ViewType,
      label: 'Passwords',
      icon: Key,
      description: 'Manage your passwords',
    },
    {
      id: 'notes' as ViewType,
      label: 'Notes',
      icon: FileText,
      description: 'Secure notes storage',
    },
    {
      id: 'settings' as ViewType,
      label: 'Settings',
      icon: Settings,
      description: 'App preferences',
    },
  ];

  const handleNavigate = (view: ViewType) => {
    onNavigate(view);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r">
      {/* Logo */}
      <div className="flex items-center space-x-2 px-6 py-4 border-b">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
          <Key className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Vault
        </h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              currentView === item.id
                ? "bg-primary text-primary-foreground"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t px-4 py-4 space-y-2">
        {/* Theme Toggle */}
        {onToggleTheme && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="w-full justify-start"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 mr-3" />
            ) : (
              <Moon className="h-4 w-4 mr-3" />
            )}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Lock Vault
        </Button>
      </div>
    </aside>
  );
};
