# Phase 1: PWA Shell & Project Setup - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver an installable, offline-capable PWA shell for iOS that includes the complete swipeable 3-panel navigation structure (Landing, Breathing placeholder, Meditation placeholder) with page indicator dots. This is the foundation every future phase builds on.

</domain>

<decisions>
## Implementation Decisions

### Deployment
- **D-01:** Host on Vercel (free tier, auto-deploy from Git, HTTPS included)
- **D-02:** Use default .vercel.app URL — no custom domain needed
- **D-03:** User handles Vercel account/repo setup — no deployment instructions needed in plan

### App Shell & Navigation
- **D-04:** 3 swipeable screens: Landing (brand), Breathing (placeholder), Meditation (placeholder)
- **D-05:** Swipe navigation scaffolded in Phase 1 (not deferred to Phase 6)
- **D-06:** Page indicator dots at the bottom showing active panel (3 dots)
- **D-07:** Landing screen shows app name and logo (logo provided by user later — use placeholder asset slot)

### PWA Identity
- **D-08:** Home screen name (short_name): "buho" (accent: "buho" for manifest compatibility)
- **D-09:** Full name: "mindfulONE"
- **D-10:** Theme color and background: pure black (#000000) — status bar blends into app
- **D-11:** Icon will be provided by user — create placeholder icon slots at required sizes (192x192, 512x512 minimum)

### Visual Design
- **D-12:** Pure black background (#000000), not dark gray
- **D-13:** Minimal dark aesthetic throughout — calm and uncluttered
- **D-14:** Breathing screen placeholder: static white circle centered on black background
- **D-15:** Meditation screen placeholder: simple text/message on black background

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value, constraints, platform requirements
- `.planning/REQUIREMENTS.md` — PWA-01 through PWA-04 (this phase's requirements)
- `.planning/ROADMAP.md` — Phase 1 success criteria and dependency graph

### Tech Stack
- `CLAUDE.md` §Technology Stack — React 19 + Vite 6, vite-plugin-pwa, Tailwind CSS 4, NoSleep.js

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, only CLAUDE.md exists

### Established Patterns
- None yet — this phase establishes the foundational patterns

### Integration Points
- PWA manifest and service worker must be configured for all 3 screens
- Swipe container must be extensible for Phase 2+ content injection

</code_context>

<specifics>
## Specific Ideas

- App is named "mindfulONE" but the home screen icon label is "buho" (owl)
- The landing screen is the first thing users see — brand identity page with name + logo
- Breathing screen (swipe once right) will eventually have the circle + config + music toggle — for now just a placeholder

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 1-PWA Shell & Project Setup*
*Context gathered: 2026-05-09*
