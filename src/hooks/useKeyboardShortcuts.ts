import { useEffect } from 'react';

type ViewType = 'home' | 'passwords' | 'notes' | 'settings';

interface KeyboardShortcutsProps {
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
  currentView: ViewType;
}

export const useKeyboardShortcuts = ({
  onNavigate,
  onLogout,
  currentView,
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Check for Cmd/Ctrl modifier
      const isModifierPressed = event.metaKey || event.ctrlKey;

      if (isModifierPressed) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            onNavigate('home');
            break;
          case '2':
            event.preventDefault();
            onNavigate('passwords');
            break;
          case '3':
            event.preventDefault();
            onNavigate('notes');
            break;
          case '4':
            event.preventDefault();
            onNavigate('settings');
            break;
          case 'l':
            event.preventDefault();
            onLogout();
            break;
        }
      }

      // Handle escape key to go back to home
      if (event.key === 'Escape' && currentView !== 'home') {
        event.preventDefault();
        onNavigate('home');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigate, onLogout, currentView]);
};
