---
phase: 05-settings-persistence
plan: 02
subsystem: session-timer
tags: [countdown, timer, auto-stop, useSessionTimer, CountdownDisplay]
dependency_graph:
  requires: [useSettings, SET_DURATION, duration-stepper, localStorage-persistence]
  provides: [useSessionTimer, CountdownDisplay, auto-stop, session-countdown]
  affects: [BreathingScreen]
tech_stack:
  added: []
  patterns: [setInterval with ref-based countdown, onComplete callback via ref for stale-closure safety, cleanup on unmount]
key_files:
  created:
    - src/hooks/useSessionTimer.ts
    - src/components/CountdownDisplay.tsx
    - src/__tests__/session-timer.test.ts
  modified:
    - src/components/BreathingScreen.tsx
decisions:
  - "useRef for onComplete callback to avoid stale closures in setInterval"
  - "remainingRef + setState pattern for both instant reads and React re-renders"
  - "CountdownDisplay renders empty string when not visible (prevents stale time flash on fade-out)"
metrics:
  duration: 2min
  completed: "2026-05-10"
  tasks: 2
  files: 4
---

# Phase 05 Plan 02: Session Countdown Timer Summary

**One-liner:** Session countdown timer with M:SS display below breathing circle and auto-stop when time expires (duration=0 means infinite)

## What Was Done

### Task 1: Create useSessionTimer hook and CountdownDisplay component (TDD)

- Created `src/hooks/useSessionTimer.ts` with start(minutes)/clear()/remaining API
- Timer uses setInterval decrementing by 1 each second, calls onComplete at zero
- start(0) is a no-op (infinite session, no countdown)
- Created `src/components/CountdownDisplay.tsx` with M:SS formatting
- Display uses aria-hidden + opacity-0 for hidden state, aria-live="polite" when visible
- Positioned absolutely below circle center with tabular-nums for stable width
- 9 tests covering timer countdown behavior and display formatting

### Task 2: Wire countdown timer and auto-stop into BreathingScreen

- Added handleAutoStop callback (useCallback) performing full stop sequence
- Initialized useSessionTimer with handleAutoStop as onComplete handler
- handleCircleTap START branch calls timerStart(state.config.duration)
- handleCircleTap STOP branch calls timerClear()
- Renders CountdownDisplay between BreathingCircle and MusicToggle
- Visibility driven by session === 'running' && config.duration > 0

## TDD Gate Compliance

- RED commit: `8a36fbb` (9 failing tests for useSessionTimer and CountdownDisplay)
- GREEN commit: `7dedfa5` (hook + component implemented, all tests pass)
- No REFACTOR needed -- implementation is minimal and follows existing hook patterns

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `npx vitest run` -- 90 tests pass (10 test files)
- `npx tsc --noEmit` -- no type errors
- useSessionTimer start(5) sets remaining=300, decrements each second
- onComplete fires when remaining reaches 0
- clear() stops countdown and resets to 0
- start(0) does not start timer (infinite mode)
- CountdownDisplay formats 300 as "5:00", 32 as "0:32"
- aria-hidden="true" and opacity-0 when not visible

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 8a36fbb | test | RED: failing tests for useSessionTimer and CountdownDisplay |
| 7dedfa5 | feat | GREEN: implement useSessionTimer hook and CountdownDisplay |
| 3c99817 | feat | Wire countdown timer and auto-stop into BreathingScreen |

## Self-Check: PASSED

- All created files verified present on disk
- All commit hashes verified in git log
