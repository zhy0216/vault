export type PasswordEntry = {
  id?: number;
  website: string;
  username: string;
  password: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export type Note = {
  id?: number;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  sessionToken?: string;
};

export type AppState = {
  auth: AuthState;
  passwords: PasswordEntry[];
  notes: Note[];
  currentView: 'passwords' | 'notes' | 'settings';
};

export type PasswordStrength = {
  score: number; // 0-4
  feedback: string[];
  warning?: string;
};

export type GeneratorOptions = {
  include_uppercase: boolean;
  include_lowercase: boolean;
  include_numbers: boolean;
  include_symbols: boolean;
  exclude_ambiguous: boolean;
};
