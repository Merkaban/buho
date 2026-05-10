# Phase 2: Breathing Timer & Animation - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the animated breathing circle with configurable inhale/hold/exhale timing, start/stop control via tap, and smooth 60fps CSS animation. This is the core UX — the thing that makes the app useful. Covers BRTH-01 through BRTH-08.

</domain>

<decisions>
## Implementation Decisions

### Circle Animation
- **D-01:** Circle scales from 48px (min/resting) to 220px (max/fully inhaled) — ~4.5x expansion ratio
- **D-02:** Inhale: smooth scale from min→max over configured duration
- **D-03:** Hold: circle stays at max size for configured duration
- **D-04:** Exhale: smooth scale from max→min over configured duration
- **D-05:** Animation must be 60fps smooth (CSS animation or requestAnimationFrame)

### Timer Defaults & Range
- **D-06:** Default timing: 5s inhale / 5s hold / 5s exhale
- **D-07:** Hold can be set to 0 (skips hold phase entirely)
- **D-08:** Session runs indefinitely (repeating cycles) until user taps stop

### Start/Stop Interaction
- **D-09:** Tap the circle to start a session
- **D-10:** Tap the circle again to stop a session
- **D-11:** Resting state: circle at minimum size (48px) with a subtle glow — should "read" like an invitation to tap
- **D-12:** During session: circle animates, no glow effect (clean breathing visual)

### On-screen Controls Layout
- **D-13:** Controls positioned above the circle (upper third of screen)
- **D-14:** Circle stays vertically centered at all times
- **D-15:** Controls visible in resting mode, fade out when session starts
- **D-16:** Controls are steppers (+/- buttons) for inhale, hold, and exhale seconds
- **D-17:** When controls fade out on start, nothing shifts — layout is stable

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value, constraints, platform requirements
- `.planning/REQUIREMENTS.md` — BRTH-01 through BRTH-08 (this phase's requirements)
- `.planning/ROADMAP.md` — Phase 2 success criteria and dependency graph

### Tech Stack
- `CLAUDE.md` §Technology Stack — React 19 + Vite, CSS animations + requestAnimationFrame, Tailwind CSS 4

### Prior Phase Context
- `.planning/phases/01-pwa-shell-project-setup/01-CONTEXT.md` — Visual design decisions (pure black bg, white circle, minimal dark aesthetic)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/BreathingScreen.tsx`: Static 120px white circle placeholder — will be replaced with animated version
- `src/components/SwipeContainer.tsx`: Scroll-snap container already holds BreathingScreen as middle panel

### Established Patterns
- Component-per-screen pattern (BreathingScreen, LandingScreen, MeditationScreen)
- Tailwind utility classes for styling, no CSS modules
- `data-panel` and `data-testid` attributes for testing

### Integration Points
- BreathingScreen is rendered inside SwipeContainer — new timer state and controls live within this component
- App.tsx manages `activePage` state — breathing session state stays local to BreathingScreen

</code_context>

<specifics>
## Specific Ideas

- Resting glow should feel like an invitation — subtle, not flashy (think ambient pulse or soft box-shadow)
- Controls above circle: inhale / hold / exhale steppers in a row, compact design
- The breathing cycle is visual meditation — transitions should be silky smooth, no janky frames

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 2-Breathing Timer & Animation*
*Context gathered: 2026-05-09*
