<!-- GSD:project-start source:PROJECT.md -->
## Project

**búho**

A progressive web app for guided meditation, designed to run on iOS without the App Store. It provides guided breathing exercises with configurable timing, audio cues, and a meditative visual animation — plus a future guided meditation mode accessible via swipe navigation.

**Core Value:** The breathing guide must work flawlessly — correct timing, smooth animation, audio cues in sync, and the screen must never lock during a session.

### Constraints

- **Platform**: Must work as PWA on iOS Safari — no App Store dependency
- **Offline**: Must function fully offline after initial load
- **Wake Lock**: Screen must not lock during active breathing session (Screen Wake Lock API with iOS fallback)
- **Audio**: Must handle iOS audio autoplay restrictions (user gesture to start)
- **Performance**: Smooth 60fps animation on the breathing circle
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack (2025)
### Frontend Framework
- **React 19 + Vite 6** — Fast builds, excellent PWA plugin ecosystem
- Alternative: Vanilla JS (simpler but harder to manage state as features grow)
- **Why React**: Component model fits the two-mode swipeable UI, large ecosystem for gestures/animations
### PWA Tooling
- **vite-plugin-pwa** (v1.x) — Zero-config service worker generation, auto-updates
- **Workbox** (underlying) — Precaching, offline-first strategies
- **Web App Manifest** — Standalone display mode for iOS home screen
### Animation
- **CSS animations + requestAnimationFrame** — For the breathing circle
- Avoid: Framer Motion (overkill for one circle), Lottie (external dependency)
- **Why native**: Single animated element, CSS transitions give smooth 60fps with minimal JS
### Audio
- **Web Audio API** — Low-latency playback, precise timing sync with animation
- Fallback: HTMLAudioElement for simpler cases
- **Howler.js** (optional) — Abstracts cross-browser audio quirks, handles iOS unlock
### Gesture/Swipe
- **Swiper.js** or custom touch handlers
- Alternative: react-swipeable (lighter, just gesture detection)
- **Why react-swipeable**: Only need left/right swipe, no carousel features needed
### Screen Wake Lock
- **Screen Wake Lock API** — Native browser API (`navigator.wakeLock`)
- **NoSleep.js** — Fallback for iOS Safari (plays invisible video trick)
- **Why both**: Wake Lock API not fully supported on iOS Safari, NoSleep.js fills the gap
### Styling
- **Tailwind CSS 4** — Utility-first, dark theme trivial, small bundle with purging
- Alternative: CSS Modules (more manual but zero runtime)
### Deployment
- **Vercel** or **Netlify** — Free tier, automatic HTTPS (required for PWA), instant deploys
- Alternative: GitHub Pages (free, slightly more manual setup)
## What NOT to Use
| Technology | Why Not |
|-----------|---------|
| Next.js | SSR/SSG overkill for client-only app |
| Redux/Zustand | App state is minimal (timer config + active/paused) |
| Native app frameworks | Defeats the PWA purpose |
| Firebase | No backend needed |
| Heavy animation libs | One circle doesn't need a framework |
## Confidence Levels
| Choice | Confidence | Notes |
|--------|-----------|-------|
| React + Vite | High | Industry standard for SPAs, excellent PWA support |
| vite-plugin-pwa | High | Most popular PWA plugin for Vite |
| CSS animations | High | Perfect for single-element animation |
| NoSleep.js for iOS | Medium | Hacky but only reliable iOS wake lock solution |
| Tailwind CSS | High | Fast iteration, dark mode built-in |
| Web Audio API | Medium | May need Howler.js wrapper for iOS quirks |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
