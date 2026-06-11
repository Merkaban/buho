import { useCallback, useEffect, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';
import { useWakeLock } from './useWakeLock';
import type { MeditationRecord } from '../types/meditation';

// 250 ms elapsed-time poll matches RESEARCH.md Pattern 4 — fine-grained enough
// for an `M:SS` display, cheap enough not to thrash React re-renders.
const ELAPSED_POLL_MS = 250;

/**
 * Map a filename's extension to the Howler-recognized format string. Howler
 * sniffs format from the URL extension by default, but Blob URLs have no
 * extension, so the hint is REQUIRED for the playback path to work on iOS
 * (RESEARCH.md Pattern 3, Pitfall 4).
 *
 * Source mapping: RESEARCH.md Pattern 3 lines 345–357.
 */
function getFormatFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'm4a' || ext === 'mp4' || ext === 'm4b') return 'mp4';
  if (ext === 'mp3' || ext === 'mpeg') return 'mp3';
  if (ext === 'wav') return 'wav';
  if (ext === 'aac') return 'aac';
  if (ext === 'ogg' || ext === 'oga') return 'ogg';
  if (ext === 'webm' || ext === 'weba') return 'webm';
  if (ext === 'flac') return 'flac';
  return 'mp3';
}

interface UseMeditationPlayerOptions {
  /**
   * Invoked when the loaded Howl emits its natural `onend` callback (D-15).
   * The hook tears the playing meditation down BEFORE calling this so the
   * caller can switch back to library view in a fully-clean state.
   */
  onEnd: () => void;
}

interface UseMeditationPlayerResult {
  play: (record: MeditationRecord) => void;
  pause: () => void;
  stop: () => void;
  isPlaying: boolean;
  elapsed: number;
  duration: number;
}

/**
 * Howler + wake-lock wrapper for the meditation player (Phase 6 D-16, D-17).
 *
 * Lifecycle invariants (RESEARCH.md State Invariants 1-3, Pattern 3):
 *   1. URL.revokeObjectURL is called AFTER howl.unload(), never before.
 *   2. Every URL.createObjectURL has a paired URL.revokeObjectURL.
 *   3. Every new Howl has a paired howl.unload().
 *   4. Hook unmount cleanup tears down playback (so swipe-away doesn't leak).
 *
 * D-18: this hook does NOT modify `useBreathingAudio` or `useWakeLock`. The
 * known wake-lock leak pitfall (RESEARCH.md Pitfall 5) is documented and
 * mitigated locally — when `play()` is called while a prior session is still
 * active, we tear that session down before activating the new one so this
 * hook does not silently double-acquire the sentinel.
 */
export function useMeditationPlayer(opts: UseMeditationPlayerOptions): UseMeditationPlayerResult {
  const howlRef = useRef<Howl | null>(null);
  const urlRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const { activate: wakeActivate, release: wakeRelease } = useWakeLock();

  // Keep onEnd / wake-lock fns in refs so the play/stop callbacks below stay
  // stable identities — important for the elapsed-time interval cleanup
  // which depends on the captured value at construction time.
  const onEndRef = useRef(opts.onEnd);
  onEndRef.current = opts.onEnd;
  const wakeActivateRef = useRef(wakeActivate);
  wakeActivateRef.current = wakeActivate;
  const wakeReleaseRef = useRef(wakeRelease);
  wakeReleaseRef.current = wakeRelease;

  const clearElapsedInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearElapsedInterval();
    const howl = howlRef.current;
    const url = urlRef.current;
    if (!howl) {
      // No active playback — nothing to release. (Pattern 3 invariant: only
      // pair-call once. Re-entering stop() after onend → stop() is a no-op.)
      return;
    }
    // Lifecycle ordering — RESEARCH.md Pattern 3 + Pitfall 1:
    //   stop()   → unload()  → revokeObjectURL → wake-lock release
    // Revoking the object URL BEFORE unload would kill the asset mid-tear-down
    // and trigger Howler's `onloaderror`, so the order is enforced here.
    howl.stop();
    howl.unload();
    if (url !== null) {
      URL.revokeObjectURL(url);
    }
    howlRef.current = null;
    urlRef.current = null;
    setIsPlaying(false);
    setElapsed(0);
    // Wake-lock release fires LAST so the screen stays awake until the
    // teardown is observably complete (mirrors `useBreathingAudio` semantics).
    wakeReleaseRef.current();
  }, [clearElapsedInterval]);

  const startElapsedInterval = useCallback(() => {
    clearElapsedInterval();
    intervalRef.current = setInterval(() => {
      const howl = howlRef.current;
      if (!howl) return;
      const seek = howl.seek();
      if (typeof seek === 'number' && Number.isFinite(seek)) {
        setElapsed(seek);
      }
    }, ELAPSED_POLL_MS);
  }, [clearElapsedInterval]);

  const play = useCallback(
    (record: MeditationRecord) => {
      // D-18 / Pitfall 5 mitigation: if a prior session is still loaded,
      // tear it down before activating the new one so we don't double-acquire
      // the wake-lock sentinel locally.
      if (howlRef.current) {
        stop();
      }

      // D-17 — same iOS-unlock pattern as `useBreathingAudio.start()`. Must run
      // synchronously inside the user gesture (the row tap that bubbled up to
      // here from `MeditationPlayer`).
      const ctx = Howler.ctx;
      if (ctx && ctx.state !== 'running') {
        ctx.resume();
      }

      const url = URL.createObjectURL(record.blob);
      urlRef.current = url;

      // RESEARCH.md Pattern 3 — `format` is REQUIRED for blob URLs (no
      // extension to sniff), `html5: true` is REQUIRED for multi-MB files.
      const howl = new Howl({
        src: [url],
        format: [getFormatFromFilename(record.filename)],
        html5: true,
        preload: true,
        onend: () => {
          stop();
          onEndRef.current();
        },
        onloaderror: (_id, err) => console.warn('Howl load error', err),
        onplayerror: (_id, err) => console.warn('Howl play error', err),
      });

      howlRef.current = howl;

      wakeActivateRef.current();
      howl.play();

      setDuration(record.duration);
      setElapsed(0);
      setIsPlaying(true);

      startElapsedInterval();
    },
    [stop, startElapsedInterval]
  );

  const pause = useCallback(() => {
    const howl = howlRef.current;
    if (!howl) return;
    howl.pause();
    clearElapsedInterval();
    setIsPlaying(false);
    // Resume must remain possible — DO NOT unload here (D-14).
    wakeReleaseRef.current();
  }, [clearElapsedInterval]);

  // Unmount cleanup — release everything (D-16; T-06-03/T-06-04 mitigation).
  useEffect(() => {
    return () => {
      if (howlRef.current) {
        stop();
      }
    };
  }, [stop]);

  return { play, pause, stop, isPlaying, elapsed, duration };
}
