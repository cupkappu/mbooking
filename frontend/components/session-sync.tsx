'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Extend the Session type to include accessToken
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

export function SessionSync() {
  const { data: session } = useSession();

  // Sync accessToken to localStorage on mount and when session changes
  useEffect(() => {
    const syncAccessToken = () => {
      const accessToken = session?.accessToken;
      if (accessToken) {
        try {
          localStorage.setItem('accessToken', accessToken);
        } catch (e) {
          // Silently handle storage errors
        }
      } else {
        // Clear token when session is null (logged out)
        try {
          localStorage.removeItem('accessToken');
        } catch (e) {
          // Silently handle storage errors
        }
      }
    };

    // Sync immediately on mount
    syncAccessToken();

    // Also sync when session changes - use a deep comparison of accessToken
    const interval = setInterval(() => {
      const currentAccessToken = session?.accessToken;
      try {
        const storedToken = localStorage.getItem('accessToken');
        if (currentAccessToken !== storedToken) {
          syncAccessToken();
        }
      } catch (e) {
        syncAccessToken();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [session]);

  return null;
}
