# Phase 6: Navigation & Meditation Placeholder - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Finalize the swipeable navigation across three panels (Landing / Breathing / Meditation) AND ship a working meditation player on the Meditation panel. The Meditation panel is no longer a passive placeholder — users upload their own meditation audio files (via iOS file picker), the app stores them locally (IndexedDB), and the user can browse a library, play a meditation, and delete entries.

**Scope expansion vs. ROADMAP.md:** The original Phase 6 scope (MEDT-01: "shows placeholder screen", MEDT-02: "consistent dark design") is replaced by a functional meditation library + player. ROADMAP.md and REQUIREMENTS.md must be updated to reflect new MEDT requirements (see Deferred Ideas → roadmap update task).

**Reframing of "two-mode" wording:** ROADMAP describes Phase 6 as "two-mode swipeable layout". The actual app is three-panel (Landing / Breathing / Meditation), as scaffolded in Phase 1 (D-04). Phase 6 confirms the three-panel structure and updates ROADMAP success criteria to match: "modes (Breathing + Meditation) plus a Landing brand panel".

</domain>

<decisions>
## Implementation Decisions

### Panel Structure
- **D-01:** Keep 3 swipeable panels: Landing (panel 0) → Breathing (panel 1) → Meditation (panel 2). No panels added or removed.
- **D-02:** Initial/default panel on app launch: **Landing (panel 0)** — current behavior preserved. No "remember last panel" persistence.
- **D-03:** ROADMAP.md success criteria for Phase 6 is reworded from "two-mode" to "modes + Landing" to match implemented reality. This is a doc update, not a code change.

### Meditation Library — Import
- **D-04:** Import via native iOS file picker (`<input type="file" accept="audio/*">`). User taps "Add meditation" → iOS Files app / iCloud Drive picker opens → user selects ONE audio file at a time. Single-select for v1 (multi-select can come later).
- **D-05:** No URL fetch, no drag-drop, no bundled meditations. The user provides all content.

### Meditation Library — Storage
- **D-06:** Audio binaries stored as **Blobs in IndexedDB** (not localStorage — file sizes are MB-scale and exceed localStorage quota). One object store, one record per meditation.
- **D-07:** Each meditation record stores: `id` (uuid or timestamp), `filename` (the original filename, used as title), `duration` (seconds, auto-extracted on import via `HTMLAudioElement.duration` or `loadedmetadata`), `blob` (the audio binary), `addedAt` (timestamp).
- **D-08:** No user-editable title. No tags. No description. Filename is the title.

### Meditation Library — UI
- **D-09:** Empty state: centered message + a single "Add meditation" button.
- **D-10:** Populated state: simple list of meditations (filename + duration on each row), tap a row to play. "Add meditation" button stays visible (e.g., at the top or bottom of the list).
- **D-11:** Each list row supports **delete** (swipe-to-delete OR a trash icon — picker chooses based on iOS-native feel; researcher should compare). Deleting removes the IndexedDB record and refunds storage.
- **D-12:** Same dark sage minimal aesthetic as breathing screen (`#5f7d60` background, ivory text/accents). Consistent with locked design tokens from Phase 1 (D-12, D-13).

### Meditation Player
- **D-13:** Minimal player UI — large centered play/pause control, meditation title above, elapsed/total time below (e.g., `02:14 / 12:34`). No seek bar. No skip buttons. No visual circle animation.
- **D-14:** Tap the play/pause control to toggle. A "back" / "stop" affordance returns to the library.
- **D-15:** Auto-stop on natural end: when audio finishes, the player closes and returns to the library view automatically.
- **D-16:** Wake lock acquired on play, released on pause/stop/end (mirrors breathing session behavior — reuse `useWakeLock` hook).

### Audio Infrastructure
- **D-17:** **Reuse Howler.js** (already a project dependency from Phase 3). One Howl instance per playing meditation. Howler handles iOS audio unlock, which the meditation player benefits from since the user's tap on a list row is a valid user gesture.
- **D-18:** Meditation playback is independent of breathing audio (`useBreathingAudio`). The two are not used simultaneously — entering Meditation panel does not stop breathing audio if a session is running, but starting meditation playback while a breathing session runs is an edge case the planner should address (likely: simply prevent or interrupt — user's responsibility to stop breathing first).

### Gesture Handling
- **D-19:** Trust native scroll-snap behavior in `SwipeContainer`. No new gesture lock during breathing sessions. No minimum-distance swipe threshold added. If real-world conflicts surface in testing, address as a follow-up.

### Claude's Discretion
- Exact list-row layout (filename truncation rules, font sizes, divider styles) — researcher/planner picks based on Phase 1–5 visual conventions.
- Swipe-to-delete vs. trash icon — researcher should evaluate iOS-native feel and propose; planner locks the choice.
- Where the "Add meditation" button sits in the populated state (top, bottom, FAB) — researcher proposes, planner picks.
- Visual treatment of the active/playing row (highlight? bold? play icon?) — design call.
- Time-format display (`12:34` vs `12 min` vs both) — design call.
- Generation of meditation `id` — uuid vs timestamp vs incrementing — researcher picks based on what's idiomatic.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value, dark minimal aesthetic, iOS PWA constraints
- `.planning/REQUIREMENTS.md` — NAV-01, NAV-02, MEDT-01, MEDT-02 (note: MEDT-* must be revised; see Deferred → roadmap update)
- `.planning/ROADMAP.md` Phase 6 — Success criteria (must be updated to reflect three-panel + functional meditation library)

### Tech Stack
- `CLAUDE.md` §Technology Stack — React 19 + Vite 6, Tailwind CSS 4, Howler.js (already installed), iOS PWA constraints

### Existing Phase Decisions That Constrain Phase 6
- `.planning/phases/01-pwa-shell-project-setup/01-CONTEXT.md` — D-04/D-05 (3 panels, swipe scaffolded), D-12/D-13 (visual aesthetic, sage `#5f7d60`)
- `.planning/phases/03-audio-integration/03-CONTEXT.md` — Howler.js setup, iOS audio unlock pattern (reuse for meditation playback)
- `.planning/phases/05-settings-persistence/05-CONTEXT.md` — localStorage persistence pattern (reference for IndexedDB schema choice)

### Source Files Forming Integration Points
- `src/App.tsx` — top-level shell mounting `SwipeContainer` + 3 panels
- `src/components/SwipeContainer.tsx` — native scroll-snap, no changes expected
- `src/components/PageDots.tsx` — 3-dot indicator, no changes expected
- `src/components/MeditationScreen.tsx` — currently a placeholder ("Meditate" label); to be rebuilt as the library + player container
- `src/hooks/useBreathingAudio.ts` — Howler.js usage pattern to mirror in a new `useMeditationAudio` (or similar) hook
- `src/hooks/useWakeLock.ts` — reuse during meditation playback
- `src/hooks/useSettings.ts` — localStorage persistence pattern (reference, not direct reuse — meditation library uses IndexedDB)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`SwipeContainer`** (`src/components/SwipeContainer.tsx`) — already supports 3 panels via children. No changes needed.
- **`PageDots`** (`src/components/PageDots.tsx`) — accepts `total` and `active` props; already wired for 3 dots in `App.tsx`.
- **`MeditationScreen`** (`src/components/MeditationScreen.tsx`) — placeholder shell to be replaced. Keeps `data-panel="meditation"`, `aria-label="Meditation"`, and the sage background.
- **Howler.js** — installed in Phase 3, accessed via `src/hooks/useBreathingAudio.ts`. The same pattern (lazy Howl construction, iOS unlock on user gesture) applies to the meditation player.
- **`useWakeLock`** (`src/hooks/useWakeLock.ts`) — `activate()` / `release()` API; ready to call from the meditation player when playback starts/stops.

### Established Patterns
- **Native scroll-snap** for swipe (no Swiper.js, no react-swipeable). Trust the browser.
- **localStorage with debounce + first-render guard** for user settings (`useSettings.ts`). For IndexedDB, the planner should adopt an analogous "lazy hydrate on mount" pattern.
- **Reducer + dispatch** for stateful screens (`breathingReducer`). The meditation library may benefit from the same shape (states: `library` | `playing`; actions: `SELECT`, `PLAY`, `PAUSE`, `STOP`, `ADDED`, `DELETED`).
- **Sage `#5f7d60` background, ivory `#f5f0eb` accents, muted `#666666` for placeholder text.**
- **`data-panel="<name>"`** + `aria-label` on each panel for accessibility / scroll detection.

### Integration Points
- New IndexedDB layer (likely a small wrapper module, e.g., `src/lib/meditationsDB.ts`) opens the DB once on app start (or on first meditation panel visit), provides `list()`, `add(file)`, `delete(id)`.
- New hook (e.g., `useMeditationLibrary`) for React-side state — list of meditations, loading state, and CRUD ops. Pulls from the IndexedDB module.
- New player hook (e.g., `useMeditationPlayer`) wrapping Howler — exposes `play(blobUrl)`, `pause()`, `stop()`, `elapsed`, `duration`, `isPlaying`. Coordinates with `useWakeLock`.
- `MeditationScreen.tsx` becomes the orchestration container — imports the library hook, the player hook, renders either the library list or the player based on state.
- File-picker integration: a hidden `<input type="file" accept="audio/*">` triggered by the "Add meditation" button. On change, read the file, extract duration via a temporary `<audio>` element's `loadedmetadata` event, then store the Blob in IndexedDB.

</code_context>

<specifics>
## Specific Ideas

- "I want to enable the user to upload audio files of recorded meditations. These need to get stored in the app and — if 1 or more are available — the user needs to be able to choose a meditation to play." — direct user statement, drives D-04 through D-16.
- The meditation panel should feel like a personal library, not a curated content store. The user is uploading their own (or family's own) recorded meditations.
- Aesthetic continuity with breathing screen is non-negotiable — no new colors, no new typography weights.

</specifics>

<deferred>
## Deferred Ideas

- **Multi-file import** — single-file picker for v1; multi-select can be a later polish phase.
- **User-editable titles, tags, descriptions** — filename-as-title is enough for v1.
- **Seek bar / scrub control in player** — minimal player for v1; if user wants to skip around long meditations, add later.
- **Skip-back / skip-forward buttons** (15s podcast-style) — same rationale.
- **Visual ambient animation during meditation playback** — keep player text-only for v1.
- **Storage quota warnings / used-space display** — only worry about it if a real user hits the limit.
- **URL fetch / paste-a-link import** — out of scope, file picker covers the use case.
- **Bundled starter meditations** — out of scope, user provides content.
- **Last-visited panel persistence** — open to landing each time is fine.
- **Gesture lock during active breathing session** — only address if real conflicts appear.

### Required Roadmap / Requirements Updates (do these before/during planning)
- ROADMAP.md Phase 6 success criteria — rewrite to:
  1. User can swipe between Landing, Breathing, and Meditation panels
  2. Page indicator shows which of the three panels is active
  3. User can upload meditation audio files via the iOS file picker
  4. Uploaded meditations persist locally (IndexedDB) across app restarts
  5. User can browse a library of uploaded meditations and tap one to play
  6. Meditation player shows title and elapsed/total time, supports play/pause/stop
  7. Screen does not lock during meditation playback
  8. User can delete meditations from the library
  9. Meditation panel uses the same dark minimal design as breathing
- REQUIREMENTS.md — replace MEDT-01/MEDT-02 with new MEDT-* requirements covering: upload, persist, library list, player UI, delete, wake lock during playback. Coverage table re-mapped to Phase 6.
- This update is a planning prerequisite — gsd-planner should treat the doc updates as Wave 1 tasks before any code work.

</deferred>

---

*Phase: 6-Navigation & Meditation Placeholder*
*Context gathered: 2026-06-10*
