import React, { useState } from 'react';
import { Note } from '@/types';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';

export const NotesManager: React.FC = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingNote(null);
  };

  const handleEditorSave = () => {
    // Trigger a refresh of the notes list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <NotesList
        key={refreshKey}
        onEdit={handleEditNote}
        onAdd={handleAddNote}
      />
      
      <NoteEditor
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
        editingNote={editingNote}
      />
    </div>
  );
};
