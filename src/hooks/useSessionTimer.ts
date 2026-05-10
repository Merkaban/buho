import { useRef, useCallback, useEffect, useState } from 'react';

export function useSessionTimer(onComplete: () => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(0);
  const [remaining, setRemaining] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    remainingRef.current = 0;
    setRemaining(0);
  }, []);

  const start = useCallback((durationMinutes: number) => {
    clear();
    if (durationMinutes <= 0) return; // 0 = infinite, no timer
    remainingRef.current = durationMinutes * 60;
    setRemaining(remainingRef.current);
    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);
      if (remainingRef.current <= 0) {
        clear();
        onCompleteRef.current();
      }
    }, 1000);
  }, [clear]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { remaining, start, clear };
}
