---
phase: 03-audio-integration
plan: 02
subsystem: audio
tags: [howler, useBreathingAudio, MusicToggle, voice-cues, mute-unmute, ios-audio]

# Dependency graph
requires:
  - phase: 03-audio-integration
    provides: Howler.js installed, placeholder MP3 assets, BreathingState with musicEnabled, failing test suite
provides:
  - useBreathingAudio hook with voice cue scheduling and music toggle
  - MusicToggle component with speaker icon and aria-pressed
  - BreathingScreen audio integration (start/stop/toggle)
  - All audio tests passing (GREEN state)
affects: [settings-persistence, wake-lock-session-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [setTimeout recursive scheduling for audio cues, Howl.mute() for position-preserving toggle, renderHook with fake timers for hook testing]

key-files:
  created:
    - src/hooks/useBreathingAudio.ts
    - src/components/MusicToggle.tsx
  modified:
    - src/components/BreathingScreen.tsx
    - src/__tests__/breathing-audio.test.ts
    - src/__tests__/pwa-config.test.ts

key-decisions:
  - "Function constructor mock pattern for Howler.js in vitest (vi.fn with this-assignment)"
  - "Separate mockPlay/mockStop/mockMute refs shared across all Howl instances for simple assertion counting"

patterns-established:
  - "renderHook + vi.useFakeTimers + vi.advanceTimersByTime for testing setTimeout-based hooks"
  - "Function constructor mock: vi.fn(function(this) { this.method = mockFn }) for class-like mocks in vitest"

requirements-completed: [BRTH-09, BRTH-10, BRTH-11, BRTH-12]

# Metrics
duration: 3min
completed: 2026-05-10
---

# Phase 03 Plan 02: Audio Implementation Summary

**useBreathingAudio hook with Howler.js voice cue scheduling, MusicToggle mute/unmute component, and BreathingScreen orchestration wiring all audio tests to GREEN**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-10T10:45:16Z
- **Completed:** 2026-05-10T10:48:14Z
- **Tasks:** 3/3 (2 auto + 1 human checkpoint approved)
- **Files modified:** 5

## Accomplishments
- Implemented useBreathingAudio hook: recursive setTimeout scheduling with 800ms initial delay, hold=0 skip, mute/unmute toggle
- Created MusicToggle component with speaker icon SVGs, aria-pressed, always-visible positioning
- Wired audio lifecycle into BreathingScreen: start/stop/toggle alongside animation
- All 64 tests pass including 10 audio behavioral tests (GREEN state from RED)
- TypeScript compiles and production build succeeds (502KB precache with audio)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement useBreathingAudio hook and MusicToggle component** - `bb979a7` (feat)
2. **Task 2: Wire audio hook and MusicToggle into BreathingScreen** - `11362a3` (feat)
3. **Task 3: Human verification checkpoint** - approved (voice cues in sync, music toggle works, iOS compatible)

## Files Created/Modified
- `src/hooks/useBreathingAudio.ts` - Audio scheduling hook: voice cues via setTimeout, music via Howl.mute()
- `src/components/MusicToggle.tsx` - Speaker icon toggle button, absolute bottom-right, always visible
- `src/components/BreathingScreen.tsx` - Orchestrator: audioStart/audioStop/toggleMusic integration
- `src/__tests__/breathing-audio.test.ts` - 10 behavioral tests with renderHook + fake timers
- `src/__tests__/pwa-config.test.ts` - Updated globPatterns assertion to include mp3

## Decisions Made
- Used function constructor mock pattern (`vi.fn(function(this) {...})`) instead of `mockImplementation(() => ({...}))` for Howler.js -- the latter is not usable with `new` keyword in vitest
- Shared mock function refs (mockPlay, mockStop, mockMute) across all Howl instances for simple call-count assertions rather than tracking individual instances

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated pwa-config.test.ts globPatterns assertion**
- **Found during:** Task 2 (full test suite run)
- **Issue:** Plan 01 added `mp3` to vite.config.ts globPatterns but did not update the corresponding test assertion
- **Fix:** Updated test expectation from `**/*.{js,css,html,ico,png,svg,woff2}` to `**/*.{js,css,html,ico,png,svg,woff2,mp3}`
- **Files modified:** src/__tests__/pwa-config.test.ts
- **Verification:** Full test suite passes (64/64)
- **Committed in:** 11362a3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing test mismatch from Plan 01. Essential fix for test suite green. No scope creep.

## Issues Encountered
- Howler.js mock pattern: `vi.fn().mockImplementation(() => ({...}))` throws "not a constructor" with `new` keyword. Resolved by using function constructor pattern with `this` assignment.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Audio integration complete -- human verification approved
- All voice cues scheduled correctly with 800ms initial delay and per-phase timing
- Music toggle uses mute/unmute for position preservation
- Ready for Phase 4 (Wake Lock & Session Polish)

## TDD Gate Compliance
- RED gate: `d4e0791` (Plan 01) - test file with 7 failing tests (module missing)
- GREEN gate: `bb979a7` (this plan) - useBreathingAudio.ts created, all 10 tests pass
- REFACTOR gate: Not needed - implementation clean on first pass

## Self-Check: PASSED

All created files verified present. Both task commits confirmed in git log.

---
*Phase: 03-audio-integration*
*Completed: 2026-05-10*
