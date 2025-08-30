import { FileText, Key, LogOut, Moon, Settings, Sun } from 'lucide-react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type ViewType = 'passwords' | 'notes' | 'settings';

type NavigationProps = {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  darkMode?: boolean;
  onToggleTheme?: () => void;
};

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  darkMode = false,
  onToggleTheme,
}) => {
  const { logout } = useAuth();

  const navigationItems = [
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
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-white dark:bg-gray-800">
      {/* Logo */}
      <div className="flex items-center space-x-2 border-b px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Key className="h-4 w-4 text-white" />
        </div>
        <h1 className="font-semibold text-gray-900 text-xl dark:text-white">
          Vault
        </h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigationItems.map((item) => (
          <button
            className={cn(
              'flex w-full items-center space-x-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors',
              currentView === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            )}
            key={item.id}
            onClick={() => handleNavigate(item.id)}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="space-y-2 border-t px-4 py-4">
        {/* Theme Toggle */}
        {onToggleTheme && (
          <Button
            className="w-full justify-start"
            onClick={onToggleTheme}
            size="sm"
            variant="ghost"
          >
            {darkMode ? (
              <Sun className="mr-3 h-4 w-4" />
            ) : (
              <Moon className="mr-3 h-4 w-4" />
            )}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
        )}

        {/* Logout */}
        <Button
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
          onClick={logout}
          size="sm"
          variant="ghost"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Lock Vault
        </Button>
      </div>
    </aside>
  );
};
