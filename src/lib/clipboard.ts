import { writeText } from '@tauri-apps/plugin-clipboard-manager';

// Store active clipboard clear timeouts to prevent multiple clears
let activeClipboardTimeout: number | null = null;

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

export const copyToClipboardWithClear = async (
  text: string, 
  clearTimeoutSeconds: number, 
  type?: string
): Promise<boolean> => {
  try {
    // Copy the text to clipboard
    await writeText(text);
    console.log(`${type || 'Text'} copied to clipboard`);

    // Clear any existing timeout
    if (activeClipboardTimeout) {
      clearTimeout(activeClipboardTimeout);
    }

    // Set up automatic clipboard clearing
    activeClipboardTimeout = setTimeout(async () => {
      try {
        await writeText(''); // Clear clipboard by writing empty string
        console.log(`Clipboard cleared after ${clearTimeoutSeconds} seconds`);
        activeClipboardTimeout = null;
      } catch (error) {
        console.error('Failed to clear clipboard:', error);
      }
    }, clearTimeoutSeconds * 1000);

    return true;
  } catch (error) {
    console.error(`Failed to copy ${type || 'text'}:`, error);
    return false;
  }
};

// Function to manually clear clipboard and cancel any pending clear
export const clearClipboard = async (): Promise<boolean> => {
  try {
    if (activeClipboardTimeout) {
      clearTimeout(activeClipboardTimeout);
      activeClipboardTimeout = null;
    }
    await writeText('');
    console.log('Clipboard manually cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear clipboard:', error);
    return false;
  }
};
