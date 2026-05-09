# Walking Skeleton — mindfulONE

**Phase:** 1
**Generated:** 2026-05-09

## Capability Proven End-to-End

> User can install the app to their iPhone home screen, open it offline without browser chrome, and swipe between three full-screen panels (Landing, Breathing, Meditation) with indicator dots showing the active panel.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19 + Vite 8 + TypeScript | Component model fits multi-screen swipeable UI, fast HMR, industry standard SPA tooling |
| Styling | Tailwind CSS 4 (CSS-first @theme) | Utility-first, zero runtime, dark mode trivial, v4 uses @import not config file |
| PWA tooling | vite-plugin-pwa (generateSW) | Zero-config Workbox service worker, manifest injection, auto-update |
| Swipe navigation | CSS scroll-snap (native) | 60fps momentum on iOS, zero JS library, supported since Safari 11 |
| Deployment target | Vercel (free tier, .vercel.app) | Auto-deploy from Git, HTTPS included (required for PWA), no config needed |
| Test framework | Vitest + jsdom + Testing Library | Fast unit tests for config validation, same ecosystem as Vite |
| Directory layout | Feature-flat under src/components/ | Small app, flat structure avoids premature nesting |

## Stack Touched in Phase 1

- [x] Project scaffold (Vite + React + TypeScript + Tailwind + PWA plugin)
- [x] Routing — 3-panel CSS scroll-snap navigation (no router needed)
- [ ] Database — N/A (client-only app, no backend)
- [x] UI — 3 interactive panels with swipe navigation and page indicator dots
- [x] Deployment — Vercel-ready build (user deploys via their account per D-03)

## Out of Scope (Deferred to Later Slices)

- Breathing animation (Phase 2)
- Audio playback (Phase 3)
- Wake lock / NoSleep.js (Phase 4)
- localStorage persistence (Phase 5)
- Dynamic content in meditation panel (Phase 6)
- Custom app icon (user provides later per D-11)
- Logo image for landing screen (user provides later per D-07)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: User can start a breathing session and see the white circle animate through inhale/hold/exhale
- Phase 3: User hears voice cues and background music synchronized with breathing phases
- Phase 4: Screen stays awake during active session on iOS
- Phase 5: User can adjust timing settings that persist across app restarts
- Phase 6: Swipe navigation extended with meditation content (navigation scaffold already built in Phase 1)
