import { Copy, Edit, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
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
import type { PasswordEntry } from '@/types';

type PasswordListProps = {
  onEdit?: (password: PasswordEntry) => void;
  onAdd?: () => void;
};

export const PasswordList: React.FC<PasswordListProps> = ({
  onEdit,
  onAdd,
}) => {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntry[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const copyToClipboard = async (text: string, _type: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_err) {}
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
                  <TableRow key={password.id}>
                    <TableCell className="font-medium">
                      {password.website}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{password.username}</span>
                        <Button
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            copyToClipboard(password.username, 'Username')
                          }
                          size="sm"
                          variant="ghost"
                        >
                          <Copy className="h-3 w-3" />
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
                          onClick={() => togglePasswordVisibility(password.id!)}
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
                          onClick={() =>
                            copyToClipboard(password.password, 'Password')
                          }
                          size="sm"
                          variant="ghost"
                        >
                          <Copy className="h-3 w-3" />
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
                          <Button size="sm" variant="ghost">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => onEdit?.(password)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-600"
                            onClick={() => handleDelete(password.id!)}
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
