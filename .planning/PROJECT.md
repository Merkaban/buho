# mindfulONE

## What This Is

A progressive web app for guided meditation, designed to run on iOS without the App Store. It provides guided breathing exercises with configurable timing, audio cues, and a meditative visual animation — plus a future guided meditation mode accessible via swipe navigation.

## Core Value

The breathing guide must work flawlessly — correct timing, smooth animation, audio cues in sync, and the screen must never lock during a session.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Guided breathing with configurable inhale/hold/exhale timing
- [ ] Visual breathing circle (grows on inhale, holds, shrinks on exhale)
- [ ] Audio cues: "breathe in", "breathe out", "hold your breath"
- [ ] Background meditation music (toggle on/off)
- [ ] Screen wake lock during active session
- [ ] Settings accessible on-screen (not buried in menus)
- [ ] Swipeable navigation between breathing mode and meditation mode
- [ ] Guided meditation placeholder screen
- [ ] PWA installable on iOS (service worker, manifest, offline-capable)

### Out of Scope

- User accounts or authentication — personal/friends tool, no backend needed
- App Store distribution — PWA-only by design
- Guided meditation content — placeholder now, content defined later
- Social features or sharing — not needed for friends/family distribution
- Analytics or tracking — keeping it simple and private

## Context

- Target platform: iOS Safari via PWA (Add to Home Screen)
- Audience: Friends and family, shared directly (no public distribution)
- Design: Minimal dark aesthetic — dark background, white breathing circle, calm and uncluttered
- No backend required — all functionality runs client-side
- Audio files will be provided by the user (4 files: breathe in, breathe out, hold, background music)
- Session runs indefinitely until user taps stop

## Constraints

- **Platform**: Must work as PWA on iOS Safari — no App Store dependency
- **Offline**: Must function fully offline after initial load
- **Wake Lock**: Screen must not lock during active breathing session (Screen Wake Lock API with iOS fallback)
- **Audio**: Must handle iOS audio autoplay restrictions (user gesture to start)
- **Performance**: Smooth 60fps animation on the breathing circle

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA over native app | Avoid App Store, easy distribution to friends/family | — Pending |
| Minimal dark design | Meditative calm, reduces distraction during sessions | — Pending |
| Client-side only | No backend needed for personal use, simpler deployment | — Pending |
| Swipe navigation between modes | Natural mobile gesture, clean UI without tabs/buttons | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-09 after initialization*
