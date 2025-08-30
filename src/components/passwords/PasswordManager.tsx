import type React from 'react';
import { useState } from 'react';
import type { PasswordEntry } from '@/types';
import { PasswordForm } from './PasswordForm';
import { PasswordList } from './PasswordList';

export const PasswordManager: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddPassword = () => {
    setEditingPassword(null);
    setIsFormOpen(true);
  };

  const handleEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPassword(null);
  };

  const handleFormSave = () => {
    // Trigger a refresh of the password list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <PasswordList
        key={refreshKey}
        onAdd={handleAddPassword}
        onEdit={handleEditPassword}
      />

      <PasswordForm
        editingPassword={editingPassword}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />
    </div>
  );
};
