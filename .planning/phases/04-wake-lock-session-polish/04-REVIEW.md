---
phase: 04-wake-lock-session-polish
reviewed: 2026-05-10T12:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/hooks/useWakeLock.ts
  - src/__tests__/wake-lock.test.ts
  - src/components/BreathingScreen.tsx
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-05-10T12:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The wake lock implementation correctly uses the Screen Wake Lock API with proper feature detection, visibility-change reacquisition, and cleanup on unmount. The test coverage is solid with 8 behavioral tests matching the requirements.

However, there is one critical gap: the project explicitly requires iOS Safari support as the primary platform, and the CLAUDE.md/stack documentation mandates a NoSleep.js fallback because the Screen Wake Lock API is not reliably supported on iOS Safari. Without this fallback, the core requirement "screen must never lock during a session" fails on the primary target platform. Additionally, there is a sentinel leak on reacquisition and floating promises in the integration layer.

## Critical Issues

### CR-01: No iOS Safari Wake Lock Fallback -- Screen Will Lock on Primary Target Platform

**File:** `src/hooks/useWakeLock.ts:8`
**Issue:** The hook only uses the standard Screen Wake Lock API (`navigator.wakeLock`). The project CLAUDE.md explicitly states the constraint: "Wake Lock: Screen must not lock during active breathing session (Screen Wake Lock API with iOS fallback)" and the technology stack specifies "NoSleep.js -- Fallback for iOS Safari (plays invisible video trick)" with rationale "Wake Lock API not fully supported on iOS Safari, NoSleep.js fills the gap." Since iOS Safari is the primary target platform for this PWA, the feature-detection guard on line 8 will cause an early return on iOS Safari, meaning the screen WILL lock during meditation sessions -- directly violating the core value statement.
**Fix:** Add NoSleep.js as a fallback when the Wake Lock API is unavailable:
```typescript
import NoSleep from 'nosleep.js';

export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const noSleepRef = useRef<NoSleep | null>(null);
  const activeRef = useRef(false);

  const request = useCallback(async () => {
    if ('wakeLock' in navigator && navigator.wakeLock) {
      try {
        sentinelRef.current = await navigator.wakeLock.request('screen');
        sentinelRef.current.addEventListener('release', () => {
          sentinelRef.current = null;
        });
      } catch (err) {
        console.warn('Wake lock request failed:', (err as Error).message);
      }
    } else {
      // iOS Safari fallback
      if (!noSleepRef.current) {
        noSleepRef.current = new NoSleep();
      }
      noSleepRef.current.enable();
    }
  }, []);

  // ... release should also disable noSleep
}
```

## Warnings

### WR-01: Sentinel Leak on Visibility-Change Reacquisition

**File:** `src/hooks/useWakeLock.ts:10-12`
**Issue:** When `request()` is called during a visibility change (line 36), it unconditionally assigns a new sentinel to `sentinelRef.current` (line 10) without first releasing or checking the existing sentinel. If the browser's "release" event on the old sentinel has not yet fired (e.g., the sentinel was auto-released by the browser going hidden but the release event was queued), the old sentinel reference is overwritten and leaked -- it can never be released by the hook. While the browser may eventually garbage-collect it, this could cause unexpected behavior if both sentinels are active simultaneously.
**Fix:** Release the existing sentinel before requesting a new one:
```typescript
const request = useCallback(async () => {
  if (!('wakeLock' in navigator) || !navigator.wakeLock) return;
  // Release existing sentinel before acquiring new one
  if (sentinelRef.current && !sentinelRef.current.released) {
    try {
      await sentinelRef.current.release();
    } catch { /* ignore */ }
    sentinelRef.current = null;
  }
  try {
    sentinelRef.current = await navigator.wakeLock.request('screen');
    sentinelRef.current.addEventListener('release', () => {
      sentinelRef.current = null;
    });
  } catch (err) {
    console.warn('Wake lock request failed:', (err as Error).message);
  }
}, []);
```

### WR-02: Floating Promises from Async Wake Lock Calls in Synchronous Handler

**File:** `src/components/BreathingScreen.tsx:28,33`
**Issue:** `wakeLockActivate()` (line 28) and `wakeLockRelease()` (line 33) are async functions returning `Promise<void>`, but they are called without `await` inside the synchronous `handleCircleTap` callback. While the internal try/catch prevents unhandled rejection from propagating in most cases, if the `release()` call on line 26 of useWakeLock.ts throws (e.g., sentinel already released by browser between the `.released` check and `.release()` call -- a TOCTOU race), the rejection would be unhandled because no caller awaits the promise. This could cause an unhandled promise rejection warning in the console or, in strict environments, crash the app.
**Fix:** Either make `handleCircleTap` async and await the calls, or add `.catch()` to suppress potential unhandled rejections:
```typescript
const handleCircleTap = () => {
  if (state.session === 'idle') {
    dispatch({ type: 'START' });
    start(state.config);
    audioStart(state.config);
    wakeLockActivate().catch(() => {}); // fire-and-forget with safety net
  } else {
    dispatch({ type: 'STOP' });
    stop();
    audioStop();
    wakeLockRelease().catch(() => {}); // fire-and-forget with safety net
  }
};
```

---

_Reviewed: 2026-05-10T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
