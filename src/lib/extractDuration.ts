// Extract duration in seconds from a user-uploaded audio File.
//
// Uses a temporary HTMLAudioElement + a blob: URL. Handles three cases:
//
//   1. `loadedmetadata` reports a finite `duration` → resolve immediately.
//   2. `loadedmetadata` reports `Infinity` (common for WebM / MediaRecorder
//      output / some VoiceMemos m4a) → seek to `Number.MAX_SAFE_INTEGER` and
//      listen for `durationchange`; resolve when a finite value arrives.
//   3. The element fires `error` → reject with
//      `Could not read audio metadata`.
//
// In every code path the object URL is revoked exactly once (RESEARCH.md
// State Invariant #2 — no leaked URLs). A `cleaned` flag guards the close.
//
// Locked by RESEARCH.md Pattern 2 (lines 297–334) and Pitfall 2 (Infinity
// fallback).
export function extractDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const url = URL.createObjectURL(file);
    audio.src = url;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      URL.revokeObjectURL(url);
    };

    const onDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        audio.removeEventListener('durationchange', onDurationChange);
        cleanup();
        resolve(audio.duration);
      }
      // Non-finite — keep listening; some files emit several durationchange
      // events before reporting a finite value.
    };

    audio.addEventListener(
      'loadedmetadata',
      () => {
        if (Number.isFinite(audio.duration)) {
          cleanup();
          resolve(audio.duration);
          return;
        }
        // Infinity fallback: seek to the end to force the media element to
        // resolve duration. Listen on a non-once handler because some files
        // fire a durationchange with NaN before the real one.
        audio.currentTime = Number.MAX_SAFE_INTEGER;
        audio.addEventListener('durationchange', onDurationChange);
      },
      { once: true },
    );

    audio.addEventListener(
      'error',
      () => {
        cleanup();
        reject(new Error('Could not read audio metadata'));
      },
      { once: true },
    );
  });
}
