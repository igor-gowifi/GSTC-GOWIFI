import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

// 30 minutes in milliseconds
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Events that indicate user activity
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
];

export function useInactivityLogout() {
  const { logout, user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetInactivityTimer = useCallback(() => {
    // Only reset if user is logged in
    if (!user) return;

    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Set new timer
    timeoutRef.current = setTimeout(async () => {
      console.log('[Inactivity] 30 minutes of inactivity detected, logging out...');
      try {
        await logout();
        // Optionally show a message or redirect
        console.log('[Inactivity] User logged out due to inactivity');
      } catch (error) {
        console.error('[Inactivity] Failed to logout:', error);
      }
    }, INACTIVITY_TIMEOUT);
  }, [user, logout]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) {
      // Clear timer if user is not logged in
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Initialize timer on mount
    resetInactivityTimer();

    // Add event listeners for user activity
    const handleActivity = () => {
      resetInactivityTimer();
    };

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, resetInactivityTimer]);

  return {
    lastActivity: lastActivityRef.current,
    resetTimer: resetInactivityTimer,
  };
}
