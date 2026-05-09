# Features Research: Meditation PWA

## Table Stakes (must have or users leave)

### Breathing Guide
- **Configurable timing** — Inhale, hold, exhale durations in seconds
- **Visual feedback** — Animated indicator showing current phase
- **Audio cues** — Voice prompts for phase transitions
- **Session control** — Start/stop with single tap
- **Screen stays on** — No lock during active session

### PWA Basics
- **Installable** — Add to Home Screen prompt/capability
- **Offline** — Works without internet after first load
- **Standalone mode** — No browser chrome when launched from home screen
- **Touch-optimized** — Large tap targets, no hover-dependent UI

### Audio
- **Background music toggle** — On/off for ambient sound
- **Voice prompt audio** — Clear, well-timed spoken cues
- **Audio respects system volume** — No forced volume levels

## Differentiators (competitive advantage)

### Visual Polish
- Smooth, calming animation (not jerky or game-like)
- Minimal distraction — nothing on screen except the breathing guide
- Dark mode that's actually restful (not just inverted colors)

### Simplicity
- No onboarding flow — immediately usable
- No account required
- Settings inline, not buried in menus
- One-tap start after configuration

### Customization
- Per-second timing control (not just preset patterns)
- Choice of with/without audio cues
- Choice of with/without background music

## Anti-Features (deliberately NOT building)

| Feature | Why Not |
|---------|---------|
| Preset breathing patterns (4-7-8, box, etc.) | User configures their own — keeps UI simple |
| Streak tracking / gamification | Undermines meditative purpose |
| Social sharing | Private practice, not performative |
| Guided meditation library | Mode 2 is TBD, avoid premature structure |
| Statistics / session history | Adds complexity without value for friends/family use |
| Haptic feedback | iOS PWA haptic support is unreliable |

## Feature Dependencies

```
PWA Shell (manifest, service worker)
  └── Breathing Mode
        ├── Timer Engine (timing logic)
        ├── Animation (circle)
        ├── Audio (cues + music)
        └── Wake Lock
  └── Meditation Mode (placeholder)
  └── Swipe Navigation (connects modes)
  └── Settings (configures breathing)
```

## Complexity Notes

| Feature | Complexity | Notes |
|---------|-----------|-------|
| Breathing circle animation | Low | CSS scale transform on a timer |
| Audio sync with animation | Medium | iOS audio restrictions, timing precision |
| Wake lock on iOS | Medium | No native API, needs NoSleep.js workaround |
| PWA install on iOS | Low | Manifest + service worker, but no install prompt |
| Swipe navigation | Low | Two panels, react-swipeable handles it |
| Settings on-screen | Low | Simple form inputs |
