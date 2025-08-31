import { Check, Copy, Edit, Eye, EyeOff, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { copyToClipboardWithClear } from '@/lib/clipboard';
import { useSettings } from '@/contexts/SettingsContext';
import type { PasswordEntry } from '@/types';

type PasswordViewerProps = {
  password: PasswordEntry;
  onClose: () => void;
  onEdit: (password: PasswordEntry) => void;
};

export const PasswordViewer: React.FC<PasswordViewerProps> = ({
  password,
  onClose,
  onEdit,
}) => {
  const { settings } = useSettings();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const handleCopy = async (text: string, type: string, itemId: string) => {
    const success = await copyToClipboardWithClear(text, settings.clearClipboardTimeout, type);
    
    if (success) {
      // Show green checkmark
      setCopiedItems(prev => new Set(prev).add(itemId));
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } else {
      // Fallback to web clipboard API if Tauri clipboard fails
      try {
        await navigator.clipboard.writeText(text);
        setCopiedItems(prev => new Set(prev).add(itemId));
        setTimeout(() => {
          setCopiedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        }, 2000);
      } catch (_fallbackErr) {
        console.error(`Failed to copy ${type}`);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Password Details</span>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(password)}
              size="sm"
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button onClick={onClose} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Website */}
        <div className="space-y-2">
          <Label className="font-semibold text-sm">Website</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-muted/50 p-3">
              <span className="font-medium">{password.website}</span>
            </div>
            <Button
              onClick={() => handleCopy(password.website, 'Website', 'website')}
              size="sm"
              variant="outline"
            >
              {copiedItems.has('website') ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label className="font-semibold text-sm">Username</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-muted/50 p-3">
              <span>{password.username}</span>
            </div>
            <Button
              onClick={() => handleCopy(password.username, 'Username', 'username')}
              size="sm"
              variant="outline"
            >
              {copiedItems.has('username') ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label className="font-semibold text-sm">Password</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-muted/50 p-3">
              <span className="font-mono">
                {isPasswordVisible ? password.password : '••••••••••••'}
              </span>
            </div>
            <Button
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              size="sm"
              variant="outline"
            >
              {isPasswordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={() => handleCopy(password.password, 'Password', 'password')}
              size="sm"
              variant="outline"
            >
              {copiedItems.has('password') ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Notes */}
        {password.notes && (
          <div className="space-y-2">
            <Label className="font-semibold text-sm">Notes</Label>
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="whitespace-pre-wrap text-sm">{password.notes}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <Label className="font-semibold text-xs text-muted-foreground">
              Created
            </Label>
            <p className="text-sm">{formatDate(password.created_at)}</p>
          </div>
          <div className="space-y-1">
            <Label className="font-semibold text-xs text-muted-foreground">
              Last Updated
            </Label>
            <p className="text-sm">{formatDate(password.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
