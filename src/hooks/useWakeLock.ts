import { useRef, useCallback, useEffect } from 'react';

export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const activeRef = useRef(false);

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator) || !navigator.wakeLock) return;
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen');
      sentinelRef.current.addEventListener('release', () => {
        sentinelRef.current = null;
      });
    } catch (err) {
      console.warn('Wake lock request failed:', (err as Error).message);
    }
  }, []);

  const activate = useCallback(async () => {
    activeRef.current = true;
    await request();
  }, [request]);

  const release = useCallback(async () => {
    activeRef.current = false;
    if (sentinelRef.current && !sentinelRef.current.released) {
      await sentinelRef.current.release();
      sentinelRef.current = null;
    }
  }, []);

  // Reacquire on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (activeRef.current && document.visibilityState === 'visible') {
        await request();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [request]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sentinelRef.current && !sentinelRef.current.released) {
        sentinelRef.current.release();
      }
    };
  }, []);

  return { activate, release };
}
