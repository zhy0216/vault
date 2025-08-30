import type React from 'react';
import { useState } from 'react';
import type { Note } from '@/types';
import { NoteEditor } from './NoteEditor';
import { NotesList } from './NotesList';

type ViewMode = 'list' | 'editor';

export const NotesManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddNote = () => {
    setEditingNote(null);
    setViewMode('editor');
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setViewMode('editor');
  };

  const handleEditorClose = () => {
    setViewMode('list');
    setEditingNote(null);
  };

  const handleEditorSave = () => {
    // Trigger a refresh of the notes list
    setRefreshKey((prev) => prev + 1);
    setViewMode('list');
  };

  return (
    <div className="space-y-6">
      {viewMode === 'list' ? (
        <NotesList
          key={refreshKey}
          onAdd={handleAddNote}
          onEdit={handleEditNote}
        />
      ) : (
        <NoteEditor
          editingNote={editingNote}
          onClose={handleEditorClose}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
};
