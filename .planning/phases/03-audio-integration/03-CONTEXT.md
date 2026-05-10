# Phase 3: Audio Integration - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver voice cues ("breathe in", "hold your breath", "breathe out") and looping background music that play in sync with the breathing animation cycle on iOS Safari. Covers BRTH-09 through BRTH-12.

</domain>

<decisions>
## Implementation Decisions

### Music Toggle Placement & Behavior
- **D-01:** Music toggle is a speaker icon button positioned in the bottom corner of the screen
- **D-02:** Toggle is always visible — does not fade out when session starts (unlike timing controls)
- **D-03:** Toggling music off cuts immediately (no fade)
- **D-04:** Music keeps its loop position internally when toggled off — toggling back on continues from where it was (unmutes rather than restarts)

### Voice Cue & Music Interaction
- **D-05:** No audio ducking — voice cues and music play simultaneously at their set volumes
- **D-06:** Voice cues always play during a session regardless of music toggle state (music toggle only controls music)
- **D-07:** No independent mute for voice cues in this phase — cues always accompany the session

### Session Start Audio Flow
- **D-08:** Background music auto-starts when session begins (if music toggle is on) — one tap starts everything
- **D-09:** Brief pause (~0.5-1s) before first voice cue plays — gives user a moment to settle after tapping
- **D-10:** When session stops, everything stops immediately (music and any playing voice cue cut)
- **D-11:** iOS audio unlock handled by the session start tap gesture (same tap that starts animation)

### Placeholder Audio
- **D-12:** Voice cue placeholders: TTS-generated "breathe in", "hold your breath", "breathe out" clips
- **D-13:** Background music placeholder: ocean waves sound (royalty-free)
- **D-14:** Audio format: MP3 for all files (universal iOS Safari support)
- **D-15:** Final audio files will be provided by user later — architecture must support simple file swap

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value, constraints, iOS audio autoplay restriction noted
- `.planning/REQUIREMENTS.md` — BRTH-09 through BRTH-12 (this phase's requirements)
- `.planning/ROADMAP.md` — Phase 3 success criteria and dependency graph

### Tech Stack
- `CLAUDE.md` §Technology Stack — Web Audio API, Howler.js (optional), iOS audio quirks

### Prior Phase Context
- `.planning/phases/02-breathing-timer-animation/02-CONTEXT.md` — Animation loop structure (onfinish recursion), circle tap interaction, controls layout

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/hooks/useBreathingAnimation.ts`: Animation loop with `onfinish` recursion — audio cue triggers can hook into the same cycle start points
- `src/components/BreathingScreen.tsx`: `handleCircleTap` is the session start/stop handler — iOS audio context unlock goes here
- `src/types/breathing.ts`: `BreathingConfig` with inhale/hold/exhale durations — audio timing derives from these

### Established Patterns
- Custom hook pattern (`useBreathingAnimation`) — audio logic should follow same hook pattern (e.g. `useBreathingAudio`)
- Reducer-based state management (`breathingReducer`) — music toggle state fits here
- `configRef` pattern for mid-session config access without re-renders

### Integration Points
- `BreathingScreen.tsx` orchestrates session state — new audio hook connects here
- `startCycle()` in `useBreathingAnimation.ts` triggers on each cycle — audio cues need to fire at cycle boundaries (inhale start, hold start, exhale start)
- Music toggle button adds to the BreathingScreen layout (bottom corner, outside the fading controls area)

</code_context>

<specifics>
## Specific Ideas

- Ocean waves for placeholder background music — calming, thematic
- Speaker icon (with waves when on, slash when off) for the music toggle — standard and recognizable
- The ~0.5-1s pause before first cue is a subtle UX touch: lets the user's attention shift from "I just tapped" to "I'm breathing now"

</specifics>

<deferred>
## Deferred Ideas

- Independent voice cue mute toggle — could add in a future polish phase if users want music-only sessions
- Volume controls (separate music/cue volume sliders) — adds complexity, not needed for MVP

</deferred>

---

*Phase: 3-Audio Integration*
*Context gathered: 2026-05-10*
