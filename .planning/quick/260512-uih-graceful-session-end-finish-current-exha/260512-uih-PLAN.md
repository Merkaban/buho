---
quick_id: 260512-uih
description: "Graceful session end: finish current exhale, stop voice cues, fade music over 10s"
date: 2026-05-12
tasks: 2
---

# Quick Plan: Graceful Session End

## Context

Currently when the session timer expires, `handleAutoStop` fires immediately — stopping animation, audio, and wake lock abruptly mid-cycle. The desired behavior:

1. When duration expires, let the current breathing cycle finish through the end of the exhale (+ hold-out if configured)
2. Stop voice cues immediately (no more "breathe in" etc. on the next cycle)
3. Keep background music playing for 10 more seconds, then stop
4. Then fully stop the session (animation stopped, wake lock released)

## Architecture

- `useBreathingAnimation`: Already uses `onfinish` callback at end of each cycle. Add a "stopping" mode that doesn't start a new cycle.
- `useBreathingAudio`: Add a `stopCues()` method that cancels scheduled voice timers but keeps music playing. Add a `fadeMusic(duration)` method.
- `BreathingScreen`: Change `handleAutoStop` to orchestrate the graceful shutdown sequence.

## Tasks

### Task 1: Add graceful stop to useBreathingAnimation and useBreathingAudio

**Files:** `src/hooks/useBreathingAnimation.ts`, `src/hooks/useBreathingAudio.ts`
**Action:**
- `useBreathingAnimation`: Add `stopAfterCycle()` — sets a flag so `onfinish` calls `stop()` instead of `startCycle()`. Returns a Promise that resolves when the cycle ends.
- `useBreathingAudio`: Add `stopCues()` — clears voice timer schedule but keeps music. Add `fadeMusic(ms)` — fades volume to 0 over given duration then stops.

**Verify:** TypeScript compiles, existing tests still pass.

### Task 2: Wire graceful shutdown in BreathingScreen

**Files:** `src/components/BreathingScreen.tsx`
**Action:**
- Change `handleAutoStop` to: call `stopCues()`, await `stopAfterCycle()`, then `fadeMusic(10000)`, then full stop (dispatch STOP, release wake lock).
- Manual stop (tap) still does immediate stop as before.

**Verify:** `npx vitest run` passes, manual test in browser confirms behavior.
