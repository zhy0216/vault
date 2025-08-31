import { Check, Shield, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/contexts/SettingsContext';

export const SettingsPage: React.FC = () => {
  const { settings, updateSetting, saveSettings, resetSettings, hasChanges } = useSettings();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Handle save with status updates
  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      saveSettings();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('idle');
    }
  };

  // Handle reset with status updates
  const handleReset = () => {
    resetSettings();
    setSaveStatus('idle');
  };


  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your vault experience and security preferences
          </p>
        </div>
        
        {hasChanges && (
          <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
            ) : saveStatus === 'saved' ? (
              <Check className="mr-2 h-4 w-4" />
            ) : null}
            {saveStatus === 'saved' ? 'Saved' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Configure security and privacy settings for your vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="autoLockTimeout">Auto-lock timeout (minutes)</Label>
              <Input
                id="autoLockTimeout"
                type="number"
                min="1"
                max="120"
                value={settings.autoLockTimeout}
                onChange={(e) => updateSetting('autoLockTimeout', parseInt(e.target.value) || 15)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clearClipboardTimeout">Clear clipboard after (seconds)</Label>
              <Input
                id="clearClipboardTimeout"
                type="number"
                min="5"
                max="300"
                value={settings.clearClipboardTimeout}
                onChange={(e) => updateSetting('clearClipboardTimeout', parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* UI Settings */}
      {/* <Card>
        <CardHeader>
          <CardTitle>User Interface</CardTitle>
          <CardDescription>
            Customize the appearance and behavior of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme preference</Label>
            <select
              id="theme"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')}
            >
              <option value="system">System preference</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

        </CardContent>
      </Card> */}


      {/* Reset Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your vault configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleReset}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Reset All Settings to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
