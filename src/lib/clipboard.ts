import { writeText } from '@tauri-apps/plugin-clipboard-manager';

export const copyToClipboard = async (text: string, type?: string): Promise<boolean> => {
  try {
    await writeText(text);
    console.log(`${type || 'Text'} copied to clipboard`);
    return true;
  } catch (error) {
    console.error(`Failed to copy ${type || 'text'}:`, error);
    return false;
  }
};
