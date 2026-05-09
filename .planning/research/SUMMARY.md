# Research Summary: mindfulONE

## Recommended Stack

**React 19 + Vite 6 + Tailwind CSS 4** with vite-plugin-pwa for service worker generation. CSS animations for the breathing circle (GPU-accelerated, smooth 60fps). Web Audio API + Howler.js for audio playback with iOS compatibility. NoSleep.js for wake lock fallback on iOS. react-swipeable for gesture navigation.

## Table Stakes Features

- Configurable breathing timing (inhale/hold/exhale in seconds)
- Visual circle animation synced to breathing phases
- Audio voice cues at phase transitions
- Background music toggle
- Screen wake lock during session
- Offline-capable PWA installable on iOS
- Start/stop with single tap
- Settings accessible inline (not hidden)

## Key Architecture Insight

The **Timer Engine** is the central nervous system — it emits phase-change events that both the animation and audio systems subscribe to independently. This keeps timing precise and components decoupled. Use requestAnimationFrame with absolute timestamps to prevent drift over long sessions.

## Critical Watch-Outs

1. **iOS audio autoplay** — Must unlock AudioContext on first user gesture or audio silently fails
2. **iOS wake lock** — Screen Wake Lock API doesn't work; need NoSleep.js invisible video hack
3. **iOS PWA background kill** — iOS terminates backgrounded PWAs aggressively; save state on visibilitychange
4. **Timer drift** — Never use setInterval; use rAF + elapsed time for accurate long-running sessions
5. **iOS safe areas** — Notch and home indicator overlap content without proper viewport-fit CSS

## Build Order Recommendation

1. PWA Shell (manifest, SW, offline, safe areas)
2. Timer Engine (state machine, event-driven)
3. Breathing Animation (circle with CSS transforms)
4. Audio Integration (cues + music, iOS unlock)
5. Wake Lock (API + NoSleep.js fallback)
6. Settings (inline UI, localStorage)
7. Swipe Navigation (two-mode layout)
8. Meditation Placeholder (coming-soon screen)

## Deployment

Vercel or Netlify free tier — automatic HTTPS (required for service workers), instant deploys from git push.
