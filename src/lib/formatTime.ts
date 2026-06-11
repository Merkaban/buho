/**
 * Format a duration (in seconds) for display.
 *
 * - For durations < 3600s, returns `M:SS` with zero-padded seconds and
 *   unpadded minutes (e.g. `0:00`, `0:05`, `1:05`, `12:34`).
 * - For durations ≥ 3600s, returns `H:MM:SS` with zero-padded minutes
 *   AND seconds (e.g. `1:00:00`, `1:02:05`, `10:00:00`).
 *
 * Fractional inputs are floored to whole seconds.
 *
 * Locked by UI-SPEC §"Time-Format Display — Locked: M:SS" (Phase 6 line 290–301)
 * and Phase 6 PATTERNS §"Time Formatting".
 */
export function formatTime(totalSeconds: number): string {
  const whole = Math.floor(totalSeconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;

  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    const mm = minutes.toString().padStart(2, '0');
    return `${hours}:${mm}:${ss}`;
  }

  return `${minutes}:${ss}`;
}
