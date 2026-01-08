// React hook for tracking user session time
import { useEffect, useRef } from 'react';
import { startSession, sendHeartbeat, endSession } from '../services/api';

/**
 * Custom hook to track user session time on the platform
 * 
 * Features:
 * - Tracks session start when component mounts
 * - Sends heartbeat every 30 seconds while user is active
 * - Tracks session end when user leaves (page unload, visibility change)
 * - Handles page visibility API (tabs switching)
 * 
 * @param {string|null} userId - User ID (null for anonymous users)
 * @returns {object} - Session tracking state
 */
export function useSessionTracker(userId = null) {
  const sessionIdRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Start session on mount
  useEffect(() => {
    let mounted = true;

    // Start the session
    startSession(userId).then((sessionId) => {
      if (mounted && sessionId) {
        sessionIdRef.current = sessionId;
        lastActivityRef.current = Date.now();
      }
    });

    // Set up heartbeat (every 30 seconds)
    heartbeatIntervalRef.current = setInterval(() => {
      if (sessionIdRef.current) {
        sendHeartbeat(sessionIdRef.current, userId);
        lastActivityRef.current = Date.now();
      }
    }, 30000); // 30 seconds

    // Track user activity (mouse movement, clicks, keyboard)
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (sessionIdRef.current) {
        sendHeartbeat(sessionIdRef.current, userId);
      }
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Handle page visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - end session
        if (sessionIdRef.current) {
          endSession(sessionIdRef.current);
          sessionIdRef.current = null;
        }
      } else {
        // Tab is visible - start new session
        startSession(userId).then((sessionId) => {
          if (mounted && sessionId) {
            sessionIdRef.current = sessionId;
            lastActivityRef.current = Date.now();
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page unload (user closes tab/window)
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for reliable delivery during page unload
        const url = '/api/user-sessions';
        const data = JSON.stringify({
          action: 'end',
          session_id: sessionIdRef.current,
        });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, data);
        } else {
          // Fallback: synchronous fetch (may be cancelled)
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
            keepalive: true,
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      mounted = false;
      
      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Remove event listeners
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // End session on unmount
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current);
      }
    };
  }, [userId]);

  return {
    sessionId: sessionIdRef.current,
    lastActivity: lastActivityRef.current,
  };
}

