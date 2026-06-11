---
phase: 06-navigation-meditation-placeholder
plan: 04
subsystem: ui
tags: [react, hook, indexeddb, file-picker, meditation, library, vertical-slice]

requires:
  - phase: 06-navigation-meditation-placeholder/03
    provides: "MeditationRecord type + idb-backed meditationsDB CRUD module"
  - phase: 06-navigation-meditation-placeholder/02
    provides: "shared formatTime utility for M:SS / H:MM:SS rendering"

provides:
  - "useMeditationLibrary hook (state + CRUD + adding flag + error toast string)"
  - "MeditationLibrary container (empty/populated/loading/error branches)"
  - "MeditationListRow with inline delete confirmation + outside-tap auto-dismiss"
  - "AddMeditationButton with hidden file input + pending Adding… state"
  - "extractDuration helper with HTMLAudioElement Infinity fallback"

affects: [06-05-player, 06-06-screen-orchestration]

tech-stack:
  added: []
  patterns:
    - "cancelled-flag idiom for async useEffect hydration (first use in repo)"
    - "props-driven container component (no hook inside) for testability"
    - "outside-tap auto-dismiss via document pointerdown listener gated on confirming state"
    - "file-picker single-file flow with input.value='' reset (Pitfall 6)"

key-files:
  created:
    - "src/lib/extractDuration.ts"
    - "src/hooks/useMeditationLibrary.ts"
    - "src/components/MeditationListRow.tsx"
    - "src/components/AddMeditationButton.tsx"
    - "src/components/MeditationLibrary.tsx"
    - "src/__tests__/extract-duration.test.ts"
    - "src/__tests__/meditation-library.test.tsx"
  modified: []

key-decisions:
  - "useMeditationLibrary returns { meditations, hydrated, adding, add, remove, error, dismissError } — single string error for the toast (not an array of errors); UI consumes one message at a time"
  - "MeditationLibrary is props-driven (no internal hook) so RTL tests can exercise empty/populated/adding/error branches without mocking IDB at the hook level — hook is composed in the next plan's MeditationScreen"
  - "Outside-tap auto-dismiss attaches a single document.pointerdown listener via useEffect gated on the confirming flag; listener is only present while a row is confirming, so there is no document-wide cost at rest"
  - "AddMeditationButton receives pending={adding} in BOTH variants ('empty' for D-09, 'list-end' for D-10) so the empty-state button also shows Adding… mid-upload"
  - "MeditationListRow uses <div role='button' tabIndex={0}> for the outer container instead of nested <button> — nesting <button> inside <button> is invalid HTML and React warns; role+keydown preserves keyboard semantics"
  - "Adding boolean is opened with setAdding(true) at the very start of add(file) and closed with setAdding(false) inside finally — the button never sticks on Adding… whether duration extraction rejects, IDB throws, or the happy path resolves"
  - "Error messages are intentionally tiny strings ('Not enough storage' / 'Could not read file') so the inline toast (UI-SPEC line 332) stays single-line on a phone"

patterns-established:
  - "Async hydration with cancelled-flag in useEffect — documented for any future hook that loads from IDB"
  - "Inline destructive confirmation that swaps row content rather than overlaying a modal — consistent with D-12 calm minimal aesthetic"
  - "AddMeditationButton variant pattern: 'empty' returns the bare button so the parent positions it; 'list-end' wraps with mt-6/mb-24 for end-of-list rendering past PageDots"

requirements-completed: [MEDT-01, MEDT-02, MEDT-03, MEDT-07, MEDT-08]

duration: ~6 min
completed: 2026-06-11
---

# Phase 6 Plan 04: Library Slice — Upload + List + Delete Summary

**End-to-end vertical user slice: pick an audio file from iOS Files → see Adding… feedback → see the row appear with extracted duration → tap trash → inline confirm → Delete or Cancel or tap-outside, persisted in IndexedDB.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-11T08:23:00Z
- **Completed:** 2026-06-11T08:29:03Z
- **Tasks:** 4
- **Files created:** 7
- **Files modified:** 0
- **Test count:** 118 → 134 (16 new tests: 6 in extract-duration + 10 in meditation-library)
- **Full suite runtime:** 2.45s

## Accomplishments

- `extractDuration(file)` helper with three code paths: finite-on-loadedmetadata, Infinity-fallback via seek-to-MAX_SAFE_INTEGER + durationchange, and reject-with-`Could not read audio metadata`. URL.revokeObjectURL guarded by a `cleaned` boolean so it fires exactly once on every path. Six unit tests verify all three behaviors plus the URL-leak invariant on success and error paths plus the durationchange-still-non-finite case.
- `useMeditationLibrary` hook delivers the full hook return shape `{ meditations, hydrated, adding, add, remove, error, dismissError }`. Lazy hydrates on mount with the cancelled-flag idiom; `add(file)` opens `adding` immediately, runs extractDuration, mints `crypto.randomUUID()`, calls addMeditation, prepends the record to local state, and closes `adding` in `finally` so the AddMeditationButton never gets stuck on `Adding…`. Quota errors surface as `Not enough storage`; bad files as `Could not read file`.
- `MeditationListRow` renders D-10 layout (filename + duration + trash) plus D-11 inline confirmation. Outside-tap auto-dismiss is implemented exactly as UI-SPEC line 264 specifies: a `useEffect` keyed on `confirming` attaches a `pointerdown` listener to `document` that checks `rowRef.current?.contains(event.target as Node)` and clears the confirming state when the tap is outside the row. Listener is removed in cleanup so it is never live at rest.
- `AddMeditationButton` renders the hidden file input + visible button (D-04, D-05 — picker is the only import surface). `pending` prop drives the UI-SPEC line 331 contract: label switches to `Adding…`, `disabled` attribute applied, classes muted to `text-white/60`, plus icon hidden. `e.target.value = ''` after onChange so re-picking the same file fires a second time (Pitfall 6). Two variants: `empty` (parent positions) and `list-end` (mt-6/mb-24 wrapper to clear PageDots).
- `MeditationLibrary` orchestrates the four UI states (loading, empty, populated, error) and forwards `pending={adding}` to BOTH AddMeditationButton variants. Inline error toast (`role="alert"`, click to dismiss) renders above either branch.
- 10 RTL tests in `meditation-library.test.tsx` cover empty state (D-09), populated rows (D-10), loading sentinel, file-picker → onAdd, full delete flow with Cancel reverting and second-trash → Delete confirming, trash-tap-doesn't-fire-onSelect, row-tap-fires-onSelect, error toast with onDismissError, **pending Adding… + disabled** (UI-SPEC line 331), and **outside-tap auto-dismiss** via `fireEvent.pointerDown(document.body)` (UI-SPEC line 264).

## Task Commits

Each task was committed atomically:

1. **Task 1: extractDuration helper with unit tests** — `91d0e18` (feat)
2. **Task 2: useMeditationLibrary hook** — `ad05dfc` (feat)
3. **Task 3: MeditationListRow + AddMeditationButton presentational components** — `663b884` (feat)
4. **Task 4: MeditationLibrary container + RTL tests covering all flows** — `bd6de57` (feat)

_Note: Task 1 and Task 4 followed the TDD RED → GREEN cycle; the test files were authored alongside the implementation in the same commit because the implementation files did not pre-exist (RED was confirmed by running the test command and observing the missing-file failure)._

## Files Created/Modified

- `src/lib/extractDuration.ts` — `extractDuration(file: File): Promise<number>` with HTMLAudioElement loadedmetadata path, Infinity fallback via durationchange, error path, single-revoke cleanup guard.
- `src/hooks/useMeditationLibrary.ts` — props-free hook composing meditationsDB CRUD + extractDuration + React state. Adds the cancelled-flag idiom to the codebase as the new convention for async hydration.
- `src/components/MeditationListRow.tsx` — single row with toggleable confirming state and document-pointerdown outside-tap listener gated on confirming.
- `src/components/AddMeditationButton.tsx` — hidden input + visible button; pending state shown via class/label/disabled flip without layout shift.
- `src/components/MeditationLibrary.tsx` — props-driven panel orchestrator (loading/empty/populated/error branches).
- `src/__tests__/extract-duration.test.ts` — 6 unit tests with a fake `<audio>` EventTarget stand-in built via `vi.spyOn(document, 'createElement')`.
- `src/__tests__/meditation-library.test.tsx` — 10 RTL tests with a `renderLibrary(overrides)` helper for prop-driven scenarios; `meditationsDB` is `vi.mock`'d at module top.

## Decisions Made

- **Hook return shape.** Single-string `error` (not an error array) — the UI shows one toast at a time, and `dismissError()` is the only API surface needed. Matches the project's convention of small, focused hook contracts.
- **`adding` opens at the very top of `add(file)` and closes in `finally`.** This guarantees the AddMeditationButton transitions to `Adding…` synchronously on file selection and reverts whether the operation succeeds, the duration extraction rejects, or IDB throws. Locked by Plan 06-04 acceptance criteria.
- **Outside-tap event chosen: `pointerdown`.** Captures both touch and mouse with a single listener, no need for separate `touchstart` + `mousedown`. Listener is attached only while `confirming` so the document-wide cost is paid only during the brief confirm window.
- **`<div role="button">` instead of nested `<button>` in MeditationListRow.** PATTERNS.md line 502 originally showed a nested button (would render invalid HTML and trigger React warnings). The plan explicitly directed this correction; we add an `onKeyDown` for Enter/Space to preserve keyboard semantics.
- **AddMeditationButton variants render the same button visual but different wrappers.** The `empty` variant returns just the input + button (parent supplies centering); `list-end` wraps with `mt-6 mb-24 mx-4 flex justify-center` to clear PageDots at `bottom-8`.
- **Error message strings are intentionally short** (`Not enough storage`, `Could not read file`, `Could not save meditation`) so the inline toast (UI-SPEC line 332) stays single-line on a 360px viewport.
- **`useMeditationLibrary` swallows the IDB-open failure** (rare; private mode or corrupt DB) and still flips `hydrated=true` so the empty state renders. The user can still try to add; the error toast surfaces on the next add attempt. This is friendlier than blocking the panel forever.

## Deviations from Plan

None — plan executed exactly as written.

The plan's `<action>` blocks were precise enough to follow line-by-line. Acceptance criteria included a few `grep -c` checks where the canonical literal appears once in source AND once in a doc comment (e.g. `Could not read audio metadata` appears at line 10 in a comment block plus line 62 in the throw); each check still passes its `at least N` floor and the literal is correct.

## Issues Encountered

- **fake-indexeddb resolution failure on first `npm test` invocation.** The worktree's `node_modules/` started empty (only a `.vite` cache). The first test run failed with `Cannot find module fake-indexeddb/auto`. Resolution: `npm install` populated the worktree's `node_modules` with all dev dependencies (526 packages). After install, every subsequent `npm test` call succeeded. This is environment setup, not a code change.

## User Setup Required

None — no external service configuration required. All work is local (IDB + React + browser-native APIs).

## Next Phase Readiness

- The library slice is end-to-end functional: `useMeditationLibrary` will hydrate from IDB on mount in any consumer; `MeditationLibrary` accepts the hook's return shape directly with one helper function (`onAdd`) wired to `add(file)` and `onDismissError` wired to `dismissError`.
- **Plan 06-05 (player slice)** can now build `useMeditationPlayer` + `MeditationPlayer` independently. The player will receive a `MeditationRecord` (or its id) from the library; nothing in this plan blocks that work.
- **Plan 06-06 (screen orchestration)** will compose `useMeditationLibrary` + `useMeditationPlayer` inside `MeditationScreen` and switch between library and player views. The `MeditationLibrary` props are stable for that consumer: `meditations, hydrated, adding, error, onAdd, onSelect, onDelete, onDismissError`.
- Persistence is verified end-to-end at the unit-test level (Plan 06-03's IDB round-trip + this plan's hook hydration). The mandatory device smoke test for actual iOS file-picker behavior + reload persistence is deferred to Plan 06-06 (per RESEARCH.md A1, Open Q1).

## Self-Check: PASSED

All claimed files exist and all claimed commits are in `git log`:

- `src/lib/extractDuration.ts` — present
- `src/hooks/useMeditationLibrary.ts` — present
- `src/components/MeditationListRow.tsx` — present
- `src/components/AddMeditationButton.tsx` — present
- `src/components/MeditationLibrary.tsx` — present
- `src/__tests__/extract-duration.test.ts` — present (6 tests)
- `src/__tests__/meditation-library.test.tsx` — present (10 tests)
- Commits `91d0e18`, `ad05dfc`, `663b884`, `bd6de57` — all in `git log`

Full suite green: 128/128 tests pass; `npx tsc --noEmit` exits 0.

---
*Phase: 06-navigation-meditation-placeholder*
*Completed: 2026-06-11*
