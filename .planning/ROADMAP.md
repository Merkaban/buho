# Roadmap: mindfulONE

**Created:** 2026-05-09
**Phases:** 6
**Requirements:** 23 mapped

## Phase Overview

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 1 | PWA Shell & Project Setup | Complete (3/3) | PWA-01, PWA-02, PWA-03, PWA-04 |
| 2 | Breathing Timer & Animation | Complete (3/3) | BRTH-01, BRTH-02, BRTH-03, BRTH-04, BRTH-05, BRTH-06, BRTH-07, BRTH-08 |
| 3 | Audio Integration | Voice cues and background music playing in sync with breathing phases | BRTH-09, BRTH-10, BRTH-11, BRTH-12 |
| 4 | Wake Lock & Session Polish | Screen stays awake during sessions, polished session experience | BRTH-13 |
| 5 | Settings & Persistence | Inline settings with localStorage persistence | SETT-01, SETT-02 |
| 6 | Navigation & Meditation Placeholder | Swipeable two-mode layout with meditation placeholder | NAV-01, NAV-02, MEDT-01, MEDT-02 |

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
**Success Criteria:**
1. Screen stays awake during active breathing session on iOS
2. Screen lock resumes normally after session stops
3. Wake lock works in both browser and standalone (PWA) mode on iOS

**Requirements:** BRTH-13

---

### Phase 5: Settings & Persistence
**Goal:** User can adjust breathing timing on-screen and settings survive app restarts
**Mode:** mvp
**Success Criteria:**
1. Timing controls (inhale/hold/exhale) are visible on the breathing screen
2. Changing a setting takes effect on the next breathing cycle
3. Settings persist after closing and reopening the app
4. Music preference (on/off) persists across sessions

**Requirements:** SETT-01, SETT-02

---

### Phase 6: Navigation & Meditation Placeholder
**Goal:** Two-mode swipeable layout with a meditation placeholder screen
**Mode:** mvp
**Success Criteria:**
1. User can swipe left/right to switch between breathing and meditation modes
2. Page indicator dots show which mode is currently active
3. Meditation screen displays a placeholder/coming-soon message
4. Meditation screen uses the same dark minimal design
5. Swipe gesture does not interfere with breathing controls

**Requirements:** NAV-01, NAV-02, MEDT-01, MEDT-02

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
*Last updated: 2026-05-10 after Plan 02-03 completion*
