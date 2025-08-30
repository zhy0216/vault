import { Check, Eye, EyeOff, RefreshCw, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passwordAPI } from '@/lib/tauri';
import type { PasswordEntry, PasswordStrength } from '@/types';

type PasswordFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingPassword?: PasswordEntry | null;
};

export const PasswordForm: React.FC<PasswordFormProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPassword,
}) => {
  const [formData, setFormData] = useState<PasswordEntry>({
    website: '',
    username: '',
    password: '',
    notes: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
  });

  useEffect(() => {
    if (editingPassword) {
      setFormData(editingPassword);
    } else {
      setFormData({
        website: '',
        username: '',
        password: '',
        notes: '',
      });
    }
    setError(null);
    setShowPassword(false);
  }, [editingPassword]);

  useEffect(() => {
    if (formData.password) {
      calculatePasswordStrength(formData.password);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [formData.password, calculatePasswordStrength]);

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Use at least 8 characters');
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include both uppercase and lowercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one number');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include special characters');
    }

    if (password.length >= 12) {
      score += 1;
    }

    setPasswordStrength({ score: Math.min(score, 4), feedback });
  };

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';

    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    const shuffled = password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    setFormData((prev) => ({ ...prev, password: shuffled }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !(
        formData.website.trim() &&
        formData.username.trim() &&
        formData.password.trim()
      )
    ) {
      setError('Website, username, and password are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingPassword?.id) {
        await passwordAPI.updatePassword(editingPassword.id, formData);
      } else {
        await passwordAPI.createPassword(formData);
      }

      onSave();
      onClose();
    } catch (_err) {
      setError('Failed to save password');
    } finally {
      setSaving(false);
    }
  };

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthText = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return 'Very Weak';
    }
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingPassword ? 'Edit Password' : 'Add New Password'}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="website">Website *</Label>
            <Input
              id="website"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
              placeholder="example.com"
              required
              type="text"
              value={formData.website}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="your-username"
              required
              type="text"
              value={formData.username}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Enter password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                />
                <Button
                  className="-translate-y-1/2 absolute top-1/2 right-2 h-6 w-6 transform p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                className="flex items-center gap-2"
                onClick={generatePassword}
                type="button"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
                Generate
              </Button>
            </div>

            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                      style={{
                        width: `${(passwordStrength.score / 4) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="font-medium text-sm">
                    {getStrengthText(passwordStrength.score)}
                  </span>
                </div>

                {passwordStrength.feedback.length > 0 && (
                  <div className="text-muted-foreground text-sm">
                    <p>Suggestions:</p>
                    <ul className="list-inside list-disc space-y-1">
                      {passwordStrength.feedback.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              id="notes"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Optional notes about this password"
              value={formData.notes || ''}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button onClick={onClose} type="button" variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button disabled={loading} type="submit">
              {loading ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {editingPassword ? 'Update' : 'Save'} Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
