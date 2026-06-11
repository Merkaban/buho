# Roadmap: mindfulONE

**Created:** 2026-05-09
**Phases:** 6
**Requirements:** 29 mapped

## Phase Overview

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 1 | PWA Shell & Project Setup | Complete (3/3) | PWA-01, PWA-02, PWA-03, PWA-04 |
| 2 | Breathing Timer & Animation | Complete (3/3) | BRTH-01, BRTH-02, BRTH-03, BRTH-04, BRTH-05, BRTH-06, BRTH-07, BRTH-08 |
| 3 | Audio Integration | Complete (2/2) | BRTH-09, BRTH-10, BRTH-11, BRTH-12 |
| 4 | Wake Lock & Session Polish | Complete (1/1) | BRTH-13 |
| 5 | Settings & Persistence | Complete (2/2) | SETT-01, SETT-02 |
| 6 | 4/6 | In Progress|  |

---

## Phase Details

### Phase 1: PWA Shell & Project Setup
**Goal:** Installable, offline-capable PWA skeleton that runs standalone on iOS with proper safe area handling
**Mode:** mvp
**Plans:** 3/3 plans executed (COMPLETE)

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Project scaffold with PWA config, iOS meta tags, and failing test suite

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — 3-panel swipeable UI shell with page dots and safe areas (makes tests pass)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-03-PLAN.md — Production build verification and iOS device checkpoint

**Success Criteria:**
1. App can be added to iOS home screen and launches without browser chrome
2. App loads and renders a dark screen when offline (airplane mode)
3. No content is hidden behind notch or home indicator
4. Manifest includes correct icons, theme color, and standalone display mode
5. Service worker precaches all static assets

**Requirements:** PWA-01, PWA-02, PWA-03, PWA-04

---

### Phase 2: Breathing Timer & Animation
**Goal:** Working breathing circle that animates smoothly through configurable inhale/hold/exhale phases with start/stop control
**Mode:** mvp
**Plans:** 3/3 plans executed (COMPLETE)

Plans:
**Wave 1**
- [x] 02-01-PLAN.md — Type contracts and failing tests (RED state for TDD)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-02-PLAN.md — Core breathing animation with tap-to-start/stop (makes tests GREEN)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 02-03-PLAN.md — Configurable timing controls with fade behavior and visual verification

**Success Criteria:**
1. User can set inhale, hold, and exhale durations (default: 5s/5s/5s)
2. Tapping start begins the breathing cycle, tapping stop ends it
3. White circle smoothly grows during inhale phase
4. White circle holds at full size during hold phase
5. White circle smoothly shrinks during exhale phase
6. Animation loops continuously until stopped
7. No visible timing drift after 5+ minutes of continuous use

**Requirements:** BRTH-01, BRTH-02, BRTH-03, BRTH-04, BRTH-05, BRTH-06, BRTH-07, BRTH-08

---

### Phase 3: Audio Integration
**Goal:** Voice cues and background music play in sync with breathing phases, working correctly on iOS
**Mode:** mvp
**Plans:** 2/2 plans executed (COMPLETE)

Plans:
**Wave 1**
- [x] 03-01-PLAN.md — Install Howler.js, generate placeholder audio, extend types, create failing tests

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 03-02-PLAN.md — Implement useBreathingAudio hook, MusicToggle component, wire into BreathingScreen

**Success Criteria:**
1. "Breathe in" audio plays at the start of each inhale phase
2. "Hold your breath" audio plays at the start of each hold phase
3. "Breathe out" audio plays at the start of each exhale phase
4. Background music loops continuously when enabled
5. Music toggle turns background music on/off without interrupting the session
6. Audio works on iOS Safari after initial user interaction (tap to start)

**Requirements:** BRTH-09, BRTH-10, BRTH-11, BRTH-12

**Notes:** Placeholder audio files used during development. User will provide final audio later.

---

### Phase 4: Wake Lock & Session Polish
**Goal:** Screen never locks during an active breathing session on iOS
**Mode:** mvp
**Plans:** 1/1 plans executed (COMPLETE)

Plans:
**Wave 1**
- [x] 04-01-PLAN.md — useWakeLock hook with TDD (RED then GREEN) and BreathingScreen integration

**Success Criteria:**
1. Screen stays awake during active breathing session on iOS
2. Screen lock resumes normally after session stops
3. Wake lock works in both browser and standalone (PWA) mode on iOS

**Requirements:** BRTH-13

---

### Phase 5: Settings & Persistence
**Goal:** User can adjust breathing timing on-screen and settings survive app restarts
**Mode:** mvp
**Plans:** 2/2 plans executed (COMPLETE)

Plans:
**Wave 1**
- [x] 05-01-PLAN.md — Duration stepper, reducer extension, localStorage persistence for all settings

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 05-02-PLAN.md — Session countdown timer with auto-stop behavior

**Success Criteria:**
1. Timing controls (inhale/hold/exhale) are visible on the breathing screen
2. Changing a setting takes effect on the next breathing cycle
3. Settings persist after closing and reopening the app
4. Music preference (on/off) persists across sessions

**Requirements:** SETT-01, SETT-02

---

### Phase 6: Navigation & Meditation Placeholder
**Goal:** Three-panel swipeable layout (Landing, Breathing, Meditation) with a working meditation library that lets the user upload, browse, play, and delete personal recordings
**Mode:** mvp
**Plans:** 4/6 plans executed

Plans:

**Wave 1**
- [x] 06-01-PLAN.md — Update ROADMAP/REQUIREMENTS for Phase 6 (replace MEDT-01/02 with MEDT-01..MEDT-08)
- [x] 06-02-PLAN.md — Install idb 8.0.3 + extract formatTime to src/lib/formatTime.ts

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 06-03-PLAN.md — MeditationRecord type + meditationsDB.ts (idb-backed CRUD) + integration tests

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 06-04-PLAN.md — Library slice: useMeditationLibrary + MeditationLibrary + MeditationListRow + AddMeditationButton + extractDuration

**Wave 4** *(blocked on Wave 3 completion)*
- [ ] 06-05-PLAN.md — Player slice: useMeditationPlayer + MeditationPlayer (Howler + wake lock)

**Wave 5** *(blocked on Wave 4 completion)*
- [ ] 06-06-PLAN.md — MeditationScreen orchestration + navigation.test.tsx update + iOS device smoke checkpoint

**Success Criteria:**
1. User can swipe between Landing, Breathing, and Meditation panels
2. Page indicator shows which of the three panels is active
3. User can upload meditation audio files via the iOS file picker
4. Uploaded meditations persist locally (IndexedDB) across app restarts
5. User can browse a library of uploaded meditations and tap one to play
6. Meditation player shows title and elapsed/total time, supports play/pause/stop
7. Screen does not lock during meditation playback
8. User can delete meditations from the library
9. Meditation panel uses the same dark minimal design as breathing

**Requirements:** NAV-01, NAV-02, MEDT-01, MEDT-02, MEDT-03, MEDT-04, MEDT-05, MEDT-06, MEDT-07, MEDT-08

---

## Dependency Graph

```
Phase 1 (PWA Shell)
  └── Phase 2 (Timer & Animation)
        ├── Phase 3 (Audio)
        ├── Phase 4 (Wake Lock)
        └── Phase 5 (Settings)
  └── Phase 6 (Navigation) — depends on Phase 2 for breathing mode content
```

---
*Created: 2026-05-09*
*Last updated: 2026-06-10 after Phase 6 requirements rewrite (MEDT-01..MEDT-08)*
