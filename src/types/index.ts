export interface PasswordEntry {
  id?: number;
  website: string;
  username: string;
  password: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Note {
  id?: number;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  sessionToken?: string;
}

export interface AppState {
  auth: AuthState;
  passwords: PasswordEntry[];
  notes: Note[];
  currentView: 'passwords' | 'notes' | 'settings';
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  warning?: string;
}

export interface GeneratorOptions {
  include_uppercase: boolean;
  include_lowercase: boolean;
  include_numbers: boolean;
  include_symbols: boolean;
  exclude_ambiguous: boolean;
}
