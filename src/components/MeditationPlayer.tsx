import { useEffect, useRef, useState } from 'react';
import { useMeditationPlayer } from '../hooks/useMeditationPlayer';
import { getMeditationBlob } from '../lib/meditationsDB';
import { formatTime } from '../lib/formatTime';
import type { MeditationMeta, MeditationRecord } from '../types/meditation';

interface MeditationPlayerProps {
  meta: MeditationMeta;
  /**
   * User tapped the back chevron OR the meditation finished naturally (D-14, D-15).
   * Caller is responsible for switching the panel back to library view.
   */
  onBack: () => void;
}

/**
 * Strip the trailing file extension for display: `morning_calm.mp3` → `morning_calm`.
 * Underscores stay as-is (UI-SPEC §"Meditation Player": "respect the user's filename").
 * Hidden filenames like `.env` keep their leading dot — only true extensions are stripped.
 */
function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(0, dot) : filename;
}

/**
 * Minimal text-only player view (Phase 6 D-13 / D-14).
 *
 * Layout: back chevron (top-left) + centered title + elapsed/total time +
 * 96px ivory play/pause disc. No seek bar, no skip buttons, no animation
 * (D-13 explicitly forbids them).
 *
 * The component owns `useMeditationPlayer`; it auto-starts playback on mount,
 * guarded against React 19 StrictMode double-mount via a `useRef<boolean>`
 * "started" flag (so play() runs exactly once across the dev double-effect).
 *
 * `onBack` is wired to the hook's `onEnd` so natural-end auto-closes the
 * player (D-15) without an extra prop or callback chain.
 */
export function MeditationPlayer({ meta, onBack }: MeditationPlayerProps) {
  const { play, pause, stop, isPlaying, elapsed, duration } = useMeditationPlayer({
    onEnd: onBack,
  });

  // ponytail: blob is loaded lazily — meta is all that lives in the library
  // state. We pull the Blob from IDB on mount, then auto-start playback.
  // Holding the record locally (not in the hook tree) so the blob is released
  // when this component unmounts.
  const [record, setRecord] = useState<MeditationRecord | null>(null);

  // StrictMode in React 19 invokes mount-effects twice in development; the
  // ref ensures we don't call play() a second time (which would tear down the
  // first session via the Pitfall-5 guard and re-init unnecessarily). No
  // cancelled-flag here on purpose — under StrictMode the cleanup runs
  // synchronously between the two mounts, so flagging would cancel the
  // pending blob load before the second mount sees it; a stale resolve after
  // a real unmount is harmless (setState is a no-op).
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    getMeditationBlob(meta.id)
      .then((blob) => {
        const r: MeditationRecord = { ...meta, blob };
        setRecord(r);
        play(r);
      })
      .catch(() => {
        onBack();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = () => {
    if (isPlaying) {
      pause();
    } else if (record) {
      play(record);
    }
  };

  const handleBack = () => {
    stop();
    onBack();
  };

  const title = stripExtension(meta.filename);
  const timeLabel = `${formatTime(elapsed)} / ${formatTime(duration)}`;

  return (
    <div
      data-testid="meditation-player"
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      <button
        onClick={handleBack}
        aria-label="Back to library"
        className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-4 w-10 h-10 flex items-center justify-center text-white/70 active:text-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <h1 className="text-lg font-normal text-white text-center max-w-[80%] truncate">
        {title}
      </h1>

      <div
        className="text-sm font-normal text-white/60 tabular-nums text-center mt-3"
        aria-live="polite"
      >
        {timeLabel}
      </div>

      {/*
        Play/pause control — 96×96 ivory disc, 32×32 sage glyph.
        - Resting glow (ivory soft halo) when paused; glow removed when playing
          so the visual matches the audible state. Conditional class chosen
          over `active:` so the glow tracks playback state, not just press.
        - Play triangle is `fill="currentColor"` (filled) — UI-SPEC §"Icon SVG"
          locks stroke-based icons; the play triangle is the documented
          exception (UI-SPEC line 210 — "play triangle when paused/idle").
      */}
      <button
        onClick={handleToggle}
        aria-label={isPlaying ? 'Pause meditation' : 'Play meditation'}
        aria-pressed={isPlaying}
        className={`mt-12 w-24 h-24 bg-[#f5f0eb] rounded-full flex items-center justify-center text-[#5f7d60] transition-shadow ${
          isPlaying ? 'shadow-none' : 'shadow-[0_0_30px_8px_rgba(245,240,235,0.4)]'
        } active:shadow-none`}
      >
        {isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
