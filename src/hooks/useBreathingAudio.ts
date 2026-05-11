import { useRef, useCallback, useEffect } from 'react';
import { Howl, Howler } from 'howler';
import type { BreathingConfig } from '../types/breathing';

const INITIAL_DELAY_MS = 800;

export function useBreathingAudio() {
  const cuesRef = useRef<{ in: Howl; hold: Howl; out: Howl } | null>(null);
  const musicRef = useRef<Howl | null>(null);
  const timersRef = useRef<number[]>([]);
  const runningRef = useRef(false);
  const musicEnabledRef = useRef(true);

  // Create Howl instances eagerly on mount so they share the global AudioContext
  useEffect(() => {
    cuesRef.current = {
      in: new Howl({ src: ['/audio/breathe-in.mp3'], html5: true, preload: true }),
      hold: new Howl({ src: ['/audio/hold.mp3'], html5: true, preload: true }),
      out: new Howl({ src: ['/audio/breathe-out.mp3'], html5: true, preload: true }),
    };
    musicRef.current = new Howl({
      src: ['/audio/meditation.mp3'],
      html5: true,
      loop: true,
      preload: true,
      volume: 0.4,
    });

    return () => {
      cuesRef.current?.in.unload();
      cuesRef.current?.hold.unload();
      cuesRef.current?.out.unload();
      musicRef.current?.unload();
    };
  }, []);

  const scheduleCycle = useCallback((config: BreathingConfig, delay: number) => {
    if (!runningRef.current || !cuesRef.current) return;

    const { inhale, hold, exhale } = config;
    const totalMs = (inhale + hold + exhale) * 1000;

    const t1 = window.setTimeout(() => {
      if (runningRef.current) cuesRef.current?.in.play();
    }, delay);
    timersRef.current.push(t1);

    if (hold > 0) {
      const t2 = window.setTimeout(() => {
        if (runningRef.current) cuesRef.current?.hold.play();
      }, delay + inhale * 1000);
      timersRef.current.push(t2);
    }

    const t3 = window.setTimeout(() => {
      if (runningRef.current) cuesRef.current?.out.play();
    }, delay + (inhale + hold) * 1000);
    timersRef.current.push(t3);

    const t4 = window.setTimeout(() => {
      scheduleCycle(config, 0);
    }, delay + totalMs);
    timersRef.current.push(t4);
  }, []);

  const start = useCallback((config: BreathingConfig) => {
    runningRef.current = true;

    // Unlock iOS AudioContext — must happen synchronously in user gesture
    const ctx = Howler.ctx;
    if (ctx && ctx.state !== 'running') {
      ctx.resume();
    }

    // Start background music if enabled (D-08)
    if (musicEnabledRef.current && musicRef.current) {
      musicRef.current.play();
    }

    // Schedule first cycle with initial delay (D-09)
    scheduleCycle(config, INITIAL_DELAY_MS);
  }, [scheduleCycle]);

  const stop = useCallback(() => {
    runningRef.current = false;
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
    musicRef.current?.stop();
    cuesRef.current?.in.stop();
    cuesRef.current?.hold.stop();
    cuesRef.current?.out.stop();
  }, []);

  const toggleMusic = useCallback((enabled: boolean) => {
    musicEnabledRef.current = enabled;
    if (musicRef.current) {
      musicRef.current.mute(!enabled);
    }
  }, []);

  return { start, stop, toggleMusic };
}
