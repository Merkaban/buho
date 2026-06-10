# Phase 6: Navigation & Meditation Placeholder - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-10
**Phase:** 6-navigation-meditation-placeholder
**Areas discussed:** Two-mode vs three-mode, Meditation screen content (expanded into full meditation player), Initial panel & navigation polish, Gesture conflict prevention, Audio infrastructure choice

---

## Two-mode vs three-mode

| Option | Description | Selected |
|--------|-------------|----------|
| Keep 3 panels (Landing/Breathing/Meditation) | Status quo from Phase 1. Update ROADMAP.md success criteria to say "two modes + landing". PageDots stays at 3 dots. | ✓ |
| Drop Landing — ship 2 panels | Match ROADMAP literally. Breathing becomes the entry screen. | |
| Keep Landing but auto-advance to Breathing | Landing as splash, then defaults to Breathing on first visit. | |

**User's choice:** Keep 3 panels.
**Notes:** Phase 1 already locked the 3-panel structure. ROADMAP wording is corrected to reflect reality rather than tearing out shipped scaffolding.

---

## Meditation screen content (scope expansion)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current minimal "Meditate" label | Single muted word, no further explanation. | |
| Add "coming soon" subtitle | Headline + subtext. | |
| Headline + short description | Slightly richer placeholder. | |
| Add small static visual | Visual placeholder hinting at future content. | |

**User's choice:** None of the above. The user rejected "placeholder" entirely and asked to build a working meditation player with file upload, local storage, and a chooser.
**Notes:** This is a meaningful scope expansion vs. the original Phase 6 spec (MEDT-01: "shows placeholder screen"). Acknowledged and rolled into the phase. ROADMAP.md and REQUIREMENTS.md need updates as Wave 1 of planning. The follow-up questions below are the actual meditation-feature decisions.

---

## Meditation library — Import method

| Option | Description | Selected |
|--------|-------------|----------|
| File picker — iOS Files / iCloud Drive | Native iOS file picker. Standard, works offline. | ✓ |
| File picker + multi-select | Same, but allow multiple files at once. | |
| Bundled-only — no upload | Files ship with app, no user import. | |
| URL fetch (paste a link) | App fetches MP3 from URL. | |

**User's choice:** File picker (single-select for v1).
**Notes:** Multi-select deferred — a polish improvement, not core.

---

## Meditation library — Storage & metadata

| Option | Description | Selected |
|--------|-------------|----------|
| IndexedDB blob + filename as title | Filename is the title, no other metadata. | |
| IndexedDB blob + user-editable title | Filename default + rename on import. | |
| IndexedDB blob + filename + auto-extracted duration | Filename + duration via `loadedmetadata`. | ✓ |
| Full metadata (title + duration + note) | Most polish, most UI scope. | |

**User's choice:** Filename + auto-extracted duration.
**Notes:** No typing required from user on import. Duration shown in list rows for quick scanning.

---

## Meditation library — UI shape

| Option | Description | Selected |
|--------|-------------|----------|
| Empty state + list once items exist | Empty: centered message + "Add" button. Populated: simple list. | ✓ |
| Always show big "Add" button + list below | Permanent prominent Add button at top. | |
| List only, "+" icon in corner | Minimal, slightly less discoverable when empty. | |
| Single-meditation mode (last replaces previous) | One slot only, no library. | |

**User's choice:** Empty state + list once items exist.
**Notes:** Standard iOS app library pattern.

---

## Meditation playback — Player UI

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — large play/pause + title + elapsed/total time | No seek bar, no skip buttons. | ✓ |
| Minimal + tappable progress bar | Adds scrub control. | |
| Player + visual breathing-circle animation | Decorative ambient pulsing visual. | |
| Player + back/forward 15s skip buttons | Podcast-style controls. | |

**User's choice:** Minimal player.
**Notes:** Calm aesthetic. Seek and skip can come later if needed.

---

## Meditation library — Additional actions

| Option | Description | Selected |
|--------|-------------|----------|
| Delete (swipe-to-delete or trash icon) | User can remove meditations. | ✓ |
| Wake lock during playback | Screen stays awake during meditation. | ✓ |
| Auto-stop on end (return to library) | Player closes when audio finishes. | ✓ |
| Storage quota warning | Show used/available, warn before quota. | |

**User's choice:** Delete + wake lock + auto-stop. Quota warning skipped for v1.
**Notes:** Quota warning is reactive polish — only address if a user hits the limit.

---

## Initial / default panel

| Option | Description | Selected |
|--------|-------------|----------|
| Landing (panel 0) — current behavior | App opens on Landing. | ✓ |
| Breathing (panel 1) — default for return users | App opens on Breathing, swipe left/right to others. | |
| Remember last visited panel | Persist active panel index in localStorage. | |

**User's choice:** Landing.
**Notes:** Current behavior preserved. Brand-first impression.

---

## Gesture conflict prevention

| Option | Description | Selected |
|--------|-------------|----------|
| Trust native scroll-snap — leave as is | Browser handles touch slop / scroll vs. tap. | ✓ |
| Lock swipe during active session | Disable horizontal scroll when breathing session is running. | |
| Lock swipe during session AND minimum-distance threshold | More aggressive conflict prevention. | |

**User's choice:** Trust native scroll-snap.
**Notes:** No real-world conflicts reported. Address only if bugs surface.

---

## Audio infrastructure for meditation player

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse Howler.js (already installed) | Consistent iOS unlock; no new dependency. | ✓ |
| Native HTMLAudioElement | Simpler, no dependency overlap. | |
| Web Audio API directly | Most control, probably overkill. | |

**User's choice:** Reuse Howler.js.
**Notes:** Phase 3 already established the iOS unlock pattern via Howler. Apply the same in `useMeditationPlayer`.

---

## Claude's Discretion

- List-row layout details (truncation, font sizes, dividers)
- Swipe-to-delete vs trash icon (researcher proposes; planner picks)
- Position of "Add meditation" button in populated state (top, bottom, FAB)
- Visual treatment of active/playing row
- Time-format display (`12:34` vs `12 min`)
- Meditation `id` generation strategy

## Deferred Ideas

- Multi-file import on a single picker action
- User-editable titles, tags, or descriptions
- Seek bar / scrub control
- Skip-back / skip-forward 15s buttons
- Ambient visual animation during playback
- Storage quota display and warnings
- URL fetch / paste-a-link import
- Bundled starter meditations
- Last-visited panel persistence
- Gesture lock during active breathing session

## Required Doc Updates (Phase 6 Wave 1 prerequisite)

- ROADMAP.md Phase 6 — rewrite success criteria to reflect three-panel + functional meditation library
- REQUIREMENTS.md — replace MEDT-01 / MEDT-02 with concrete meditation upload / library / player / delete / wake-lock requirements
