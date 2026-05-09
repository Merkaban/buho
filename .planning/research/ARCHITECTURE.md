# Architecture Research: Meditation PWA

## System Structure

```
┌─────────────────────────────────────────────┐
│                PWA Shell                      │
│  (Service Worker, Manifest, Offline Cache)   │
├─────────────────────────────────────────────┤
│              App Container                    │
│  ┌───────────────┐  ┌───────────────┐       │
│  │ Breathing Mode│◄─►│Meditation Mode│       │
│  │               │   │  (Placeholder)│       │
│  └───────┬───────┘  └───────────────┘       │
│          │         Swipe Navigation           │
├──────────┼──────────────────────────────────┤
│          ▼                                   │
│  ┌─────────────┐                             │
│  │Timer Engine │─── Controls timing cycle    │
│  └──────┬──────┘                             │
│         │                                    │
│    ┌────┼────┐                               │
│    ▼    ▼    ▼                               │
│  ┌───┐┌───┐┌────┐                           │
│  │Viz││Aud││Wake│                            │
│  │   ││io ││Lock│                            │
│  └───┘└───┘└────┘                            │
├─────────────────────────────────────────────┤
│           Settings (localStorage)            │
└─────────────────────────────────────────────┘
```

## Components

### 1. PWA Shell
- Service worker for offline caching (precache all assets)
- Web app manifest (name, icons, display: standalone, theme-color)
- Cache-first strategy for audio files and app assets

### 2. App Container
- Root component managing navigation state
- Swipe gesture handler (left/right between modes)
- Page indicator dots

### 3. Timer Engine (Core Logic)
- State machine: IDLE → INHALE → HOLD → EXHALE → (loop)
- Configurable durations per phase (seconds)
- Emits phase-change events consumed by animation and audio
- Runs via requestAnimationFrame for smooth timing

### 4. Breathing Animation
- Single DOM element (circle div)
- CSS transform: scale() driven by timer progress
- Inhale: scale 0.3 → 1.0
- Hold: scale 1.0 (static)
- Exhale: scale 1.0 → 0.3
- Transition timing matches configured seconds

### 5. Audio Manager
- Loads 4 audio files (3 voice cues + 1 background)
- Plays voice cue at each phase transition
- Background music loops independently (toggle on/off)
- Handles iOS audio unlock (first user gesture unlocks AudioContext)

### 6. Wake Lock
- Requests Screen Wake Lock API on session start
- Falls back to NoSleep.js on iOS Safari
- Releases on session stop

### 7. Settings
- Stored in localStorage (persists across sessions)
- Fields: inhaleTime, holdTime, exhaleTime, musicEnabled
- Rendered inline on the breathing screen (not a separate page)

## Data Flow

```
User taps Start
  → Timer Engine starts (INHALE phase)
  → Wake Lock acquired
  → Audio: plays "breathe in"
  → Animation: circle grows

Timer reaches inhaleTime
  → Timer transitions to HOLD
  → Audio: plays "hold your breath"
  → Animation: circle stays big

Timer reaches holdTime
  → Timer transitions to EXHALE
  → Audio: plays "breathe out"
  → Animation: circle shrinks

Timer reaches exhaleTime
  → Timer transitions to INHALE (loop)
  → Audio: plays "breathe in"
  → Animation: circle grows

User taps Stop
  → Timer stops
  → Wake Lock released
  → Animation resets
  → Audio stops
```

## Suggested Build Order

1. **PWA Shell** — Manifest, service worker, basic offline support
2. **Timer Engine** — Core timing logic (testable without UI)
3. **Breathing Animation** — Circle with CSS transitions
4. **Audio Integration** — Cues synced to timer, iOS handling
5. **Wake Lock** — Keep screen on during sessions
6. **Settings** — Inline config, localStorage persistence
7. **Swipe Navigation** — Two-mode layout with gesture support
8. **Meditation Placeholder** — Second screen with coming-soon state

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Timer as event emitter | Decouples timing from rendering — animation and audio subscribe independently |
| CSS animations over JS | GPU-accelerated, smoother on mobile, less battery drain |
| localStorage over IndexedDB | Simple key-value config, no complex data |
| Audio preloading | Avoid latency on first play — preload all 4 files at app start |
| No router | Two views, swipe-managed — no URL routing needed |
