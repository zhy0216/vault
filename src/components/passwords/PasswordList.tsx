import { Check, Copy, Edit, Eye, EyeOff, Plus, Trash2, View } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { passwordAPI } from '@/lib/tauri';
import { copyToClipboardWithClear } from '@/lib/clipboard';
import { useSettings } from '@/contexts/SettingsContext';
import type { PasswordEntry } from '@/types';

type PasswordListProps = {
  onEdit?: (password: PasswordEntry) => void;
  onAdd?: () => void;
  onView?: (password: PasswordEntry) => void;
};

export const PasswordList: React.FC<PasswordListProps> = ({
  onEdit,
  onAdd,
  onView,
}) => {
  const { settings } = useSettings();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPasswords();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchPasswords(searchQuery);
    } else {
      setFilteredPasswords(passwords);
    }
  }, [searchQuery, passwords]);

  const loadPasswords = async () => {
    try {
      setLoading(true);
      const data = await passwordAPI.getPasswords();
      setPasswords(data);
      setFilteredPasswords(data);
    } catch (_err) {
      setError('Failed to load passwords');
    } finally {
      setLoading(false);
    }
  };

  const searchPasswords = async (query: string) => {
    try {
      const results = await passwordAPI.searchPasswords(query);
      setFilteredPasswords(results);
    } catch (_err) {
      // Fallback to client-side filtering
      const filtered = passwords.filter(
        (password) =>
          password.website.toLowerCase().includes(query.toLowerCase()) ||
          password.username.toLowerCase().includes(query.toLowerCase()) ||
          password.notes?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPasswords(filtered);
    }
  };

  const togglePasswordVisibility = (id: number) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

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
        console.error('Failed to copy to clipboard');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this password?')) {
      return;
    }

    try {
      await passwordAPI.deletePassword(id);
      await loadPasswords(); // Reload the list
    } catch (_err) {
      setError('Failed to delete password');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'N/A';
    }
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
            <p>Loading passwords...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button className="mt-4" onClick={loadPasswords}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Passwords ({filteredPasswords.length})</CardTitle>
          <Button className="flex items-center gap-2" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add Password
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            className="max-w-sm"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passwords..."
            value={searchQuery}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredPasswords.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchQuery
              ? 'No passwords found matching your search.'
              : 'No passwords saved yet.'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPasswords.map((password) => (
                  <TableRow 
                    key={password.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onView?.(password)}
                  >
                    <TableCell className="font-medium">
                      {password.website}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{password.username}</span>
                        <Button
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(password.username, 'Username', `username-${password.id}`);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          {copiedItems.has(`username-${password.id}`) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {visiblePasswords.has(password.id!)
                            ? password.password
                            : '••••••••'}
                        </span>
                        <Button
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePasswordVisibility(password.id!);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          {visiblePasswords.has(password.id!) ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(password.password, 'Password', `password-${password.id}`);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          {copiedItems.has(`password-${password.id}`) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {password.notes
                          ? password.notes.length > 50
                            ? `${password.notes.substring(0, 50)}...`
                            : password.notes
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {formatDate(password.updated_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              onView?.(password);
                            }}
                          >
                            <View className="h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.(password);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(password.id!);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
