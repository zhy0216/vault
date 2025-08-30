import { Edit, FileText, Plus, Search, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { notesAPI } from '@/lib/tauri';
import type { Note } from '@/types';

type NotesListProps = {
  onEdit: (note: Note) => void;
  onAdd: () => void;
};

export const NotesList: React.FC<NotesListProps> = ({ onEdit, onAdd }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNotes(filtered);
    }
  }, [notes, searchQuery]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedNotes = await notesAPI.getNotes();
      setNotes(fetchedNotes);
    } catch (_err) {
      setError('Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await notesAPI.deleteNote(id);
      await loadNotes(); // Refresh the list
    } catch (_err) {
      setError('Failed to delete note. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) {
      return content;
    }
    return `${content.substring(0, maxLength)}...`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          <p className="mt-4 text-muted-foreground">Loading notes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
            Secure Notes
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Store and manage your sensitive information securely
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
        <Input
          className="pl-10"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes by title or content..."
          value={searchQuery}
        />
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="mb-4 text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first secure note to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Note
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card className="transition-shadow hover:shadow-lg" key={note.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="truncate pr-2 text-lg">
                    {note.title}
                  </CardTitle>
                  <div className="flex flex-shrink-0 gap-1">
                    <Button
                      className="h-8 w-8 p-0"
                      onClick={() => onEdit(note)}
                      size="sm"
                      variant="ghost"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => note.id && handleDelete(note.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {note.updated_at && (
                  <CardDescription className="text-xs">
                    Updated {formatDate(note.updated_at)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <p className="whitespace-pre-wrap text-gray-600 text-sm dark:text-gray-400">
                  {truncateContent(note.content)}
                </p>
                {note.content.length > 150 && (
                  <Button
                    className="mt-2 h-auto p-0 text-xs"
                    onClick={() => onEdit(note)}
                    size="sm"
                    variant="link"
                  >
                    Read more
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {filteredNotes.length > 0 && (
        <div className="flex justify-center">
          <Badge variant="secondary">
            {filteredNotes.length}{' '}
            {filteredNotes.length === 1 ? 'note' : 'notes'}
            {searchQuery && ` matching "${searchQuery}"`}
          </Badge>
        </div>
      )}
    </div>
  );
};
