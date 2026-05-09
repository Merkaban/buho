# Requirements: mindfulONE

**Defined:** 2026-05-09
**Core Value:** The breathing guide must work flawlessly — correct timing, smooth animation, audio cues in sync, and the screen must never lock during a session.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### PWA Foundation

- [x] **PWA-01**: App is installable on iOS via Add to Home Screen
- [x] **PWA-02**: App works fully offline after initial load
- [x] **PWA-03**: App runs in standalone mode without browser chrome
- [x] **PWA-04**: App handles iOS safe areas (notch, home indicator)

### Breathing

- [ ] **BRTH-01**: User can configure inhale duration in seconds
- [ ] **BRTH-02**: User can configure hold duration in seconds
- [ ] **BRTH-03**: User can configure exhale duration in seconds
- [ ] **BRTH-04**: User can start a breathing session with a single tap
- [ ] **BRTH-05**: User can stop a breathing session with a single tap
- [ ] **BRTH-06**: White circle grows during inhale phase
- [ ] **BRTH-07**: White circle stays large during hold phase
- [ ] **BRTH-08**: White circle shrinks during exhale phase
- [ ] **BRTH-09**: "Breathe in" audio plays at start of inhale
- [ ] **BRTH-10**: "Hold your breath" audio plays at start of hold
- [ ] **BRTH-11**: "Breathe out" audio plays at start of exhale
- [ ] **BRTH-12**: Background music can be toggled on/off
- [ ] **BRTH-13**: Screen does not lock during active session

**Note:** Audio files (3 voice cues + 1 background music) will be provided by user later. Placeholder/silent files acceptable during development.

### Settings

- [ ] **SETT-01**: Timing settings are accessible on the breathing screen
- [ ] **SETT-02**: Settings persist across app restarts (localStorage)

### Navigation

- [ ] **NAV-01**: User can swipe between breathing mode and meditation mode
- [ ] **NAV-02**: Page indicator shows which mode is active

### Meditation

- [ ] **MEDT-01**: Meditation mode shows placeholder screen
- [ ] **MEDT-02**: Meditation mode uses consistent dark design

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Resilience

- **RESL-01**: Session state survives brief app backgrounding on iOS
- **RESL-02**: Smooth transition when returning from background

### PWA Polish

- **PWAP-01**: Install instruction banner for first-time users
- **PWAP-02**: Auto-update notification when new version deployed

### Breathing Presets

- **PRST-01**: Built-in breathing patterns (4-7-8, box breathing, etc.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Personal tool for friends/family, no backend needed |
| App Store distribution | PWA-only by design |
| Guided meditation content | Placeholder now, content defined later |
| Session history / statistics | Adds complexity without value for this audience |
| Streak tracking / gamification | Undermines meditative purpose |
| Social sharing | Private practice |
| Haptic feedback | iOS PWA haptic support unreliable |
| Real-time features | No backend, no need |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PWA-01 | Phase 1 | Complete |
| PWA-02 | Phase 1 | Complete |
| PWA-03 | Phase 1 | Complete |
| PWA-04 | Phase 1 | Complete |
| BRTH-01 | Phase 2 | Pending |
| BRTH-02 | Phase 2 | Pending |
| BRTH-03 | Phase 2 | Pending |
| BRTH-04 | Phase 2 | Pending |
| BRTH-05 | Phase 2 | Pending |
| BRTH-06 | Phase 2 | Pending |
| BRTH-07 | Phase 2 | Pending |
| BRTH-08 | Phase 2 | Pending |
| BRTH-09 | Phase 3 | Pending |
| BRTH-10 | Phase 3 | Pending |
| BRTH-11 | Phase 3 | Pending |
| BRTH-12 | Phase 3 | Pending |
| BRTH-13 | Phase 4 | Pending |
| SETT-01 | Phase 5 | Pending |
| SETT-02 | Phase 5 | Pending |
| NAV-01 | Phase 6 | Pending |
| NAV-02 | Phase 6 | Pending |
| MEDT-01 | Phase 6 | Pending |
| MEDT-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-09*
*Last updated: 2026-05-09 after initial definition*
