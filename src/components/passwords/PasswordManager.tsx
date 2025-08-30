import type React from 'react';
import { useState } from 'react';
import type { PasswordEntry } from '@/types';
import { PasswordForm } from './PasswordForm';
import { PasswordList } from './PasswordList';
import { PasswordViewer } from './PasswordViewer';

type ViewMode = 'list' | 'form' | 'view';

export const PasswordManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(
    null
  );
  const [viewingPassword, setViewingPassword] = useState<PasswordEntry | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddPassword = () => {
    setEditingPassword(null);
    setViewMode('form');
  };

  const handleEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setViewMode('form');
  };

  const handleViewPassword = (password: PasswordEntry) => {
    setViewingPassword(password);
    setViewMode('view');
  };

  const handleFormClose = () => {
    setViewMode('list');
    setEditingPassword(null);
  };

  const handleViewerClose = () => {
    setViewMode('list');
    setViewingPassword(null);
  };

  const handleViewerEdit = (password: PasswordEntry) => {
    setEditingPassword(password);
    setViewingPassword(null);
    setViewMode('form');
  };

  const handleFormSave = () => {
    // Trigger a refresh of the password list
    setRefreshKey((prev) => prev + 1);
    setViewMode('list');
  };

  return (
    <div className="space-y-6">
      {viewMode === 'list' && (
        <PasswordList
          key={refreshKey}
          onAdd={handleAddPassword}
          onEdit={handleEditPassword}
          onView={handleViewPassword}
        />
      )}

      {viewMode === 'form' && (
        <PasswordForm
          editingPassword={editingPassword}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      {viewMode === 'view' && viewingPassword && (
        <PasswordViewer
          password={viewingPassword}
          onClose={handleViewerClose}
          onEdit={handleViewerEdit}
        />
      )}
    </div>
  );
};
