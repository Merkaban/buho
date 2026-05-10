---
phase: 03-audio-integration
plan: 01
subsystem: audio
tags: [howler, tts, mp3, workbox, pwa, offline-audio]

# Dependency graph
requires:
  - phase: 02-breathing-timer-animation
    provides: breathingReducer, BreathingState types, animation hook
provides:
  - Howler.js dependency installed for audio playback
  - 4 placeholder MP3 audio assets (TTS voice cues + ocean waves music)
  - Extended BreathingState with musicEnabled field
  - TOGGLE_MUSIC action in reducer
  - Failing test suite for audio hook (TDD RED state)
  - Workbox configured to precache MP3 files offline
affects: [03-audio-integration plan 02, settings, offline]

# Tech tracking
tech-stack:
  added: [howler, "@types/howler"]
  patterns: [TDD RED-first test scaffolding, vi.importActual for deferred module resolution]

key-files:
  created:
    - public/audio/breathe-in.mp3
    - public/audio/hold.mp3
    - public/audio/breathe-out.mp3
    - public/audio/ocean-waves.mp3
    - src/__tests__/breathing-audio.test.ts
  modified:
    - package.json
    - vite.config.ts
    - src/types/breathing.ts
    - src/hooks/useBreathingAnimation.ts
    - src/__tests__/breathing-state.test.ts
    - src/components/BreathingScreen.tsx

key-decisions:
  - "Used macOS say command with Samantha voice for TTS placeholder generation"
  - "Used vi.importActual for deferred module resolution so reducer tests pass while hook tests fail (RED)"
  - "Brown noise with band-pass filter for ocean waves placeholder (~241KB, 15s loop)"

patterns-established:
  - "Audio assets in public/audio/ directory for simple file swap with final assets"
  - "musicEnabled default true (D-08: music on by default)"

requirements-completed: [BRTH-09, BRTH-10, BRTH-11, BRTH-12]

# Metrics
duration: 4min
completed: 2026-05-10
---

# Phase 03 Plan 01: Audio Foundation Summary

**Howler.js installed with TTS placeholder audio assets, musicEnabled state/reducer, and failing test suite establishing TDD RED gate for Plan 02**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-10T10:38:57Z
- **Completed:** 2026-05-10T10:42:33Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Installed Howler.js with TypeScript types for cross-browser audio playback
- Generated 4 placeholder MP3 files (3 TTS voice cues via macOS say, 1 ocean waves via brown noise synthesis)
- Extended type system with musicEnabled field and TOGGLE_MUSIC action
- Created comprehensive test suite covering BRTH-09/10/11/12 requirements
- Updated Workbox precache to include MP3 files for offline playback

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Howler.js, generate placeholder audio, update workbox config** - `6e2d1f7` (feat)
2. **Task 2: Extend types with TOGGLE_MUSIC action, update reducer, create failing audio tests** - `d4e0791` (test)

## Files Created/Modified
- `public/audio/breathe-in.mp3` - TTS "Breathe in" voice cue placeholder (4KB)
- `public/audio/hold.mp3` - TTS "Hold your breath" voice cue placeholder (7KB)
- `public/audio/breathe-out.mp3` - TTS "Breathe out" voice cue placeholder (5KB)
- `public/audio/ocean-waves.mp3` - Brown noise ocean waves background music placeholder (241KB)
- `src/__tests__/breathing-audio.test.ts` - Test suite for audio requirements (3 pass, 7 fail RED)
- `package.json` - Added howler + @types/howler dependencies
- `vite.config.ts` - Added mp3 to workbox globPatterns for offline precaching
- `src/types/breathing.ts` - Added musicEnabled field and TOGGLE_MUSIC action
- `src/hooks/useBreathingAnimation.ts` - Added TOGGLE_MUSIC case to reducer
- `src/__tests__/breathing-state.test.ts` - Updated initialState with musicEnabled
- `src/components/BreathingScreen.tsx` - Updated initialState with musicEnabled

## Decisions Made
- Used macOS `say` command with Samantha voice for generating TTS placeholders -- avoids external API dependencies
- Used `vi.importActual` pattern for deferred module resolution so reducer tests pass while hook tests correctly fail (RED state)
- Generated ocean waves from brown noise with bandpass filter (100-800Hz) -- realistic ambient sound without external assets

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added musicEnabled to BreathingScreen.tsx initialState**
- **Found during:** Task 2 (Type extension)
- **Issue:** BreathingScreen.tsx also declares a BreathingState object literal that would fail TypeScript compilation without the new required musicEnabled field
- **Fix:** Added `musicEnabled: true` to the initialState in BreathingScreen.tsx
- **Files modified:** src/components/BreathingScreen.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** d4e0791 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for type correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Howler.js ready for import in useBreathingAudio hook (Plan 02)
- All 4 audio assets in place for Howl constructor paths
- Type contracts established -- Plan 02 implements against failing tests
- Workbox already configured for offline audio -- no additional config needed

## TDD Gate Compliance
- RED gate: `d4e0791` - test file created with 7 failing tests (import fails for missing useBreathingAudio module)
- GREEN gate: Deferred to Plan 02 (will create useBreathingAudio.ts to make tests pass)
- Reducer tests pass immediately as implementation was part of this plan's scope

## Self-Check: PASSED

All created files verified present. Both task commits confirmed in git log.

---
*Phase: 03-audio-integration*
*Completed: 2026-05-10*
