import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface SettingsData {
  // Security Settings
  autoLockTimeout: number; // minutes
  
  // UI Settings
  theme: 'light' | 'dark' | 'system';
  
  // Privacy Settings
  clearClipboardTimeout: number; // seconds
}

const defaultSettings: SettingsData = {
  autoLockTimeout: 5,
  theme: 'system',
  clearClipboardTimeout: 5,
};

interface SettingsContextType {
  settings: SettingsData;
  updateSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
  saveSettings: () => void;
  resetSettings: () => void;
  hasChanges: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('vault-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem('vault-settings', JSON.stringify(settings));
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Update a setting and mark as changed
  const updateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const value: SettingsContextType = {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
    hasChanges,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
