import { useEffect, useRef, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface UseAutoLockOptions {
  timeout: number; // timeout in minutes
  onLock: () => void;
  isAuthenticated: boolean;
}

export const useAutoLock = ({ timeout, onLock, isAuthenticated }: UseAutoLockOptions) => {
  const timeoutRef = useRef<number | null>(null);
  const windowRef = useRef<any>(null);

  const clearAutoLockTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setAutoLockTimeout = useCallback(() => {
    clearAutoLockTimeout();
    
    if (isAuthenticated && timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        onLock();
      }, timeout * 60 * 1000); // Convert minutes to milliseconds
    }
  }, [timeout, onLock, isAuthenticated, clearAutoLockTimeout]);

  const handleWindowFocus = useCallback(() => {
    // Window gained focus - clear the timeout
    clearAutoLockTimeout();
  }, [clearAutoLockTimeout]);

  const handleWindowBlur = useCallback(() => {
    // Window lost focus - set the auto-lock timeout
    setAutoLockTimeout();
  }, [setAutoLockTimeout]);

  useEffect(() => {
    const setupWindowListeners = async () => {
      try {
        windowRef.current = getCurrentWindow();
        
        // Listen for window focus events
        const unlistenFocus = await windowRef.current.onFocusChanged(({ payload }: { payload: boolean }) => {
          if (payload) {
            handleWindowFocus();
          } else {
            handleWindowBlur();
          }
        });

        return unlistenFocus;
      } catch (error) {
        console.error('Failed to setup window listeners:', error);
        return () => {};
      }
    };

    let cleanup: (() => void) | undefined;

    if (isAuthenticated) {
      setupWindowListeners().then((unlistenFn) => {
        cleanup = unlistenFn;
      });
    }

    return () => {
      clearAutoLockTimeout();
      if (cleanup) {
        cleanup();
      }
    };
  }, [isAuthenticated, handleWindowFocus, handleWindowBlur, clearAutoLockTimeout]);

  // Clear timeout when component unmounts or user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearAutoLockTimeout();
    }
  }, [isAuthenticated, clearAutoLockTimeout]);

  return {
    clearAutoLockTimeout,
    setAutoLockTimeout,
  };
};
