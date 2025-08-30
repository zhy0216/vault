import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, ArrowLeft, Clock, FileText } from 'lucide-react';
import { Note } from '@/types';
import { notesAPI } from '@/lib/tauri';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingNote: Note | null;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  editingNote
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSaveTimeoutRef = useRef<number>();
  const initialDataRef = useRef<{ title: string; content: string } | null>(null);

  // Initialize form when editing note changes
  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      initialDataRef.current = { title: editingNote.title, content: editingNote.content };
      setHasUnsavedChanges(false);
    } else {
      setTitle('');
      setContent('');
      initialDataRef.current = { title: '', content: '' };
      setHasUnsavedChanges(false);
    }
    setError(null);
    setLastSaved(null);
  }, [editingNote, isOpen]);

  // Track changes for auto-save
  useEffect(() => {
    if (!initialDataRef.current) return;

    const hasChanges = 
      title !== initialDataRef.current.title || 
      content !== initialDataRef.current.content;
    
    setHasUnsavedChanges(hasChanges);

    // Auto-save logic
    if (hasChanges && editingNote?.id && (title.trim() || content.trim())) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        window.clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        window.clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, editingNote]);

  const handleAutoSave = async () => {
    if (!editingNote?.id || !title.trim()) return;

    try {
      setIsSaving(true);
      const noteData: Note = {
        title: title.trim(),
        content: content.trim()
      };

      await notesAPI.updateNote(editingNote.id, noteData);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      initialDataRef.current = { title: title.trim(), content: content.trim() };
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Note title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const noteData: Note = {
        title: title.trim(),
        content: content.trim()
      };

      if (editingNote?.id) {
        await notesAPI.updateNote(editingNote.id, noteData);
      } else {
        await notesAPI.createNote(noteData);
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      onSave();
      onClose();
    } catch (err) {
      setError('Failed to save note. Please try again.');
      console.error('Error saving note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {editingNote ? 'Edit Note' : 'New Note'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Auto-save status */}
            {editingNote && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                    Saving...
                  </>
                ) : lastSaved ? (
                  <>
                    <Clock className="h-3 w-3" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    Unsaved changes
                  </>
                ) : null}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="note-title">Title *</Label>
            <Input
              id="note-title"
              placeholder="Enter note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2 flex-1">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              id="note-content"
              placeholder="Write your note content here..."
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              className="min-h-[400px] resize-none font-mono text-sm"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              {content.length} characters
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading || !title.trim()}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Note
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
