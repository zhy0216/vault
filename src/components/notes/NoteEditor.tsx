import { ArrowLeft, Clock, FileText, Save } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notesAPI } from '@/lib/tauri';
import type { Note } from '@/types';

type NoteEditorProps = {
  onClose: () => void;
  onSave: () => void;
  editingNote: Note | null;
};

export const NoteEditor: React.FC<NoteEditorProps> = ({
  onClose,
  onSave,
  editingNote,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSaveTimeoutRef = useRef<number | undefined>(undefined);
  const initialDataRef = useRef<{ title: string; content: string } | null>(
    null
  );

  // Initialize form when editing note changes
  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      initialDataRef.current = {
        title: editingNote.title,
        content: editingNote.content,
      };
      setHasUnsavedChanges(false);
    } else {
      setTitle('');
      setContent('');
      initialDataRef.current = { title: '', content: '' };
      setHasUnsavedChanges(false);
    }
    setError(null);
    setLastSaved(null);
  }, [editingNote]);

  // Track changes for auto-save
  useEffect(() => {
    if (!initialDataRef.current) {
      return;
    }

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
    if (!(editingNote?.id && title.trim())) {
      return;
    }

    try {
      setIsSaving(true);
      const noteData: Note = {
        title: title.trim(),
        content: content.trim(),
      };

      await notesAPI.updateNote(editingNote.id, noteData);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      initialDataRef.current = { title: title.trim(), content: content.trim() };
    } catch (_err) {
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
        content: content.trim(),
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
    } catch (_err) {
      setError('Failed to save note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      )
    ) {
      return;
    }
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-bold text-2xl text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {editingNote ? 'Edit Note' : 'New Note'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {editingNote ? 'Modify your secure note' : 'Create a new secure note'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-save status */}
          {editingNote && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-primary border-b" />
                  Saving...
                </>
              ) : lastSaved ? (
                <>
                  <Clock className="h-4 w-4" />
                  Saved {lastSaved.toLocaleTimeString()}
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  Unsaved changes
                </>
              ) : null}
            </div>
          )}
          <Button onClick={handleClose} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notes
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="note-title">Title *</Label>
            <Input
              className="font-medium text-lg"
              id="note-title"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              value={title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              className="min-h-[400px] resize-y font-mono text-sm"
              id="note-content"
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setContent(e.target.value)
              }
              placeholder="Write your note content here..."
              value={content}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-muted-foreground text-sm">
              {content.length} characters
            </div>
            <div className="flex gap-2">
              <Button
                disabled={isLoading}
                onClick={handleClose}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                disabled={isLoading || !title.trim()}
                onClick={handleSave}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
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
