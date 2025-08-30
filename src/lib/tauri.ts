import { invoke } from '@tauri-apps/api/core';
import type { Note, PasswordEntry } from '@/types';

// Authentication commands
export const authAPI = {
  async isMasterPasswordSet(): Promise<boolean> {
    return await invoke('is_master_password_set');
  },

  async setMasterPassword(password: string): Promise<void> {
    return await invoke('set_master_password', { password });
  },

  async verifyMasterPassword(password: string): Promise<boolean> {
    return await invoke('verify_master_password', { password });
  },

  async createSession(): Promise<string> {
    return await invoke('create_session');
  },

  async validateSession(token: string): Promise<boolean> {
    return await invoke('validate_session', { token });
  },

  async lockSession(token: string): Promise<void> {
    return await invoke('lock_session', { token });
  },
};

// Password management commands
export const passwordAPI = {
  async getPasswords(): Promise<PasswordEntry[]> {
    return await invoke('get_passwords');
  },

  async createPassword(entry: PasswordEntry): Promise<number> {
    return await invoke('create_password', { entry });
  },

  async updatePassword(id: number, entry: PasswordEntry): Promise<void> {
    return await invoke('update_password', { id, entry });
  },

  async deletePassword(id: number): Promise<void> {
    return await invoke('delete_password', { id });
  },

  async searchPasswords(query: string): Promise<PasswordEntry[]> {
    return await invoke('search_passwords', { query });
  },
};

// Notes management commands
export const notesAPI = {
  async getNotes(): Promise<Note[]> {
    return await invoke('get_notes');
  },

  async createNote(note: Note): Promise<number> {
    return await invoke('create_note', { note });
  },

  async updateNote(id: number, note: Note): Promise<void> {
    return await invoke('update_note', { id, note });
  },

  async deleteNote(id: number): Promise<void> {
    return await invoke('delete_note', { id });
  },
};
