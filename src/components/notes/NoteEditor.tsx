import { ArrowLeft, Clock, FileText, Save, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notesAPI } from '@/lib/tauri';
import type { Note } from '@/types';

type NoteEditorProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingNote: Note | null;
};

export const NoteEditor: React.FC<NoteEditorProps> = ({
  isOpen,
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
  }, [title, content, editingNote, handleAutoSave]);

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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {editingNote ? 'Edit Note' : 'New Note'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Auto-save status */}
            {editingNote && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                {isSaving ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-primary border-b" />
                    Saving...
                  </>
                ) : lastSaved ? (
                  <>
                    <Clock className="h-3 w-3" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    Unsaved changes
                  </>
                ) : null}
              </div>
            )}
            <Button onClick={handleClose} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="max-h-[calc(90vh-120px)] space-y-4 overflow-y-auto">
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

          <div className="flex-1 space-y-2">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              className="min-h-[400px] resize-none font-mono text-sm"
              id="note-content"
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setContent(e.target.value)
              }
              placeholder="Write your note content here..."
              value={content}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-muted-foreground text-xs">
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
