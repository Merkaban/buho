# Phase 3: Audio Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 3-Audio Integration
**Areas discussed:** Music toggle placement & behavior, Voice cue & music interaction, Session start audio flow, Placeholder audio for development

---

## Music Toggle Placement & Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| With timing controls (top) | In the upper area alongside steppers — fades out when session starts | |
| Always visible (bottom corner) | Small icon button in bottom corner — stays visible during session | ✓ |
| Always visible (top corner) | Small icon button in top corner — stays visible during session | |

**User's choice:** Always visible (bottom corner)

| Option | Description | Selected |
|--------|-------------|----------|
| Fade out (~1s) | Smooth fade to silence over ~1s | |
| Cut immediately | Instant stop — simpler, immediate feedback | ✓ |

**User's choice:** Cut immediately

| Option | Description | Selected |
|--------|-------------|----------|
| Restart from beginning | Music always starts fresh | |
| Continue looping | Music keeps loop position, just unmutes | ✓ |
| You decide | Let Claude pick simplest approach | |

**User's choice:** Continue looping

| Option | Description | Selected |
|--------|-------------|----------|
| Music note icon | Standard music note, crossed out when muted | |
| Speaker icon | Speaker with waves/slash — generic audio control | ✓ |
| You decide | Let Claude pick what fits minimal aesthetic | |

**User's choice:** Speaker icon

---

## Voice Cue & Music Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Duck music during cues | Music volume drops while voice plays | |
| No ducking, full mix | Voice and music at set volumes simultaneously | ✓ |
| You decide | Let Claude pick based on iOS constraints | |

**User's choice:** No ducking, full mix

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, always play cues | Music toggle only controls music — cues always guide | ✓ |
| Music toggle mutes everything | Toggle acts as master audio switch | |
| Separate controls | Two toggles: music and voice cues | |

**User's choice:** Yes, always play cues

| Option | Description | Selected |
|--------|-------------|----------|
| Not in this phase | Keep simple — cues always play, mute option later | ✓ |
| Second toggle for voice cues | Add another icon button for independent cue mute | |

**User's choice:** Not in this phase

---

## Session Start Audio Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, auto-start with session | Music begins when session starts (if toggle on) | ✓ |
| Music plays independently | Music not tied to session lifecycle | |

**User's choice:** Yes, auto-start with session

| Option | Description | Selected |
|--------|-------------|----------|
| Everything stops immediately | Music and voice cues cut when session ends | ✓ |
| Music fades out, cues stop | Voice stops instantly, music fades ~1-2s | |
| You decide | Let Claude pick natural approach | |

**User's choice:** Everything stops immediately

| Option | Description | Selected |
|--------|-------------|----------|
| Immediately on tap | First cue plays right as animation starts | |
| Brief pause first (~0.5-1s) | Short silence before first cue — settle moment | ✓ |
| You decide | Let Claude determine based on animation timing | |

**User's choice:** Brief pause first (~0.5-1s)

---

## Placeholder Audio for Development

| Option | Description | Selected |
|--------|-------------|----------|
| Silent files (structure only) | Empty audio files — tests plumbing without sound | |
| Simple tones/chimes | Different pitched beeps for each phase | |
| Generated TTS cues | TTS-generated 'breathe in', 'hold', 'breathe out' clips | ✓ |

**User's choice:** Generated TTS cues

| Option | Description | Selected |
|--------|-------------|----------|
| Silent loop file | Empty audio file that loops | |
| Simple ambient tone | Quiet sustained note or drone | |
| Royalty-free ambient track | Short CC ambient loop for realistic testing | |

**User's choice:** Ocean waves sound (free-text)

| Option | Description | Selected |
|--------|-------------|----------|
| MP3 | Universal browser support, good compression | ✓ |
| AAC/M4A | Native iOS format, slightly better quality | |
| You decide | Let Claude pick best iOS PWA compatibility | |

**User's choice:** MP3

---

## Claude's Discretion

None — user made all decisions explicitly.

## Deferred Ideas

- Independent voice cue mute toggle — for future polish phase (music-only sessions)
- Volume controls (separate sliders) — adds complexity, not needed for MVP
