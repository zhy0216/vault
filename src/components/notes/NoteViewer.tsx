import { ArrowLeft, Edit, FileText, Clock } from 'lucide-react';
import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Note } from '@/types';

type NoteViewerProps = {
  note: Note;
  onClose: () => void;
  onEdit: (note: Note) => void;
};

export const NoteViewer: React.FC<NoteViewerProps> = ({ note, onClose, onEdit }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-bold text-2xl text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6" />
            View Note
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Reading your secure note
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onEdit(note)} variant="default">
            <Edit className="mr-2 h-4 w-4" />
            Edit Note
          </Button>
          <Button onClick={onClose} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {note.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {note.created_at && (
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created {formatDate(note.created_at)}
                  </CardDescription>
                )}
                {note.updated_at && note.updated_at !== note.created_at && (
                  <Badge variant="secondary" className="text-xs">
                    Updated {formatDate(note.updated_at)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
              {note.content || (
                <span className="text-muted-foreground italic">
                  This note has no content.
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-muted-foreground text-sm">
              {note.content.length} characters
            </div>
            <Button onClick={() => onEdit(note)} size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
