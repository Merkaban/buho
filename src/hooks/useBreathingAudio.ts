import { useRef, useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import type { BreathingConfig } from '../types/breathing';

const INITIAL_DELAY_MS = 800; // D-09: brief pause before first cue

export function useBreathingAudio() {
  const cuesRef = useRef<{ in: Howl; hold: Howl; out: Howl } | null>(null);
  const musicRef = useRef<Howl | null>(null);
  const timersRef = useRef<number[]>([]);
  const runningRef = useRef(false);
  const musicEnabledRef = useRef(true);

  const ensureLoaded = useCallback(() => {
    if (!cuesRef.current) {
      cuesRef.current = {
        in: new Howl({ src: ['/audio/breathe-in.mp3'], preload: true }),
        hold: new Howl({ src: ['/audio/hold.mp3'], preload: true }),
        out: new Howl({ src: ['/audio/breathe-out.mp3'], preload: true }),
      };
    }
    if (!musicRef.current) {
      musicRef.current = new Howl({
        src: ['/audio/ocean-waves.mp3'],
        loop: true,
        preload: true,
        volume: 0.4,
      });
    }
  }, []);

  const scheduleCycle = useCallback((config: BreathingConfig, delay: number) => {
    if (!runningRef.current || !cuesRef.current) return;

    const { inhale, hold, exhale } = config;
    const totalMs = (inhale + hold + exhale) * 1000;

    // Schedule "breathe in" cue
    const t1 = window.setTimeout(() => {
      if (runningRef.current) cuesRef.current?.in.play();
    }, delay);
    timersRef.current.push(t1);

    // Schedule "hold" cue -- skip when hold=0 (Pitfall 4)
    if (hold > 0) {
      const t2 = window.setTimeout(() => {
        if (runningRef.current) cuesRef.current?.hold.play();
      }, delay + inhale * 1000);
      timersRef.current.push(t2);
    }

    // Schedule "breathe out" cue
    const t3 = window.setTimeout(() => {
      if (runningRef.current) cuesRef.current?.out.play();
    }, delay + (inhale + hold) * 1000);
    timersRef.current.push(t3);

    // Schedule next cycle (no delay for subsequent cycles)
    const t4 = window.setTimeout(() => {
      scheduleCycle(config, 0);
    }, delay + totalMs);
    timersRef.current.push(t4);
  }, []);

  const start = useCallback((config: BreathingConfig) => {
    ensureLoaded();
    runningRef.current = true;

    // Start background music if enabled (D-08)
    if (musicEnabledRef.current && musicRef.current) {
      musicRef.current.play();
    }

    // Schedule first cycle with initial delay (D-09)
    scheduleCycle(config, INITIAL_DELAY_MS);
  }, [ensureLoaded, scheduleCycle]);

  const stop = useCallback(() => {
    runningRef.current = false;
    // Clear all scheduled timeouts (Pitfall 5)
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
    // Stop all audio immediately (D-10)
    musicRef.current?.stop();
    cuesRef.current?.in.stop();
    cuesRef.current?.hold.stop();
    cuesRef.current?.out.stop();
  }, []);

  const toggleMusic = useCallback((enabled: boolean) => {
    musicEnabledRef.current = enabled;
    if (musicRef.current) {
      // D-04: mute preserves loop position, unmute resumes from same position
      musicRef.current.mute(!enabled);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
      timersRef.current.forEach(id => window.clearTimeout(id));
      timersRef.current = [];
      musicRef.current?.unload();
      cuesRef.current?.in.unload();
      cuesRef.current?.hold.unload();
      cuesRef.current?.out.unload();
    };
  }, []);

  return { start, stop, toggleMusic, ensureLoaded };
}
