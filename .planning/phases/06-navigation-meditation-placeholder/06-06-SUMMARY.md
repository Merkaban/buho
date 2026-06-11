---
phase: 06-navigation-meditation-placeholder
plan: 06
subsystem: meditation-screen-orchestration
tags: [react, integration, view-state, navigation, checkpoint, vertical-slice-close]

requires:
  - phase: 06-navigation-meditation-placeholder/04
    provides: "useMeditationLibrary hook + MeditationLibrary container"
  - phase: 06-navigation-meditation-placeholder/05
    provides: "MeditationPlayer component (Howler + wake lock)"

provides:
  - "MeditationScreen orchestration container — owns useMeditationLibrary, view-state ('library' | 'playing'), and renders the matching child component"
  - "Render-switch (not co-existing DOM) view branching per UI-SPEC §Component Hierarchy"
  - "Deleted-while-playing recovery effect — falls back to library if the selected record disappears from the meditations array"
  - "Updated navigation.test.tsx — legacy 'Meditate' placeholder assertion replaced with empty-state Add meditation button assertion (MEDT-03), per-test IDB cleanup added"
  - "meditation-screen.test.tsx — 7 integration tests covering panel root contract + view-state transitions"

affects: [phase-6-shippable]

tech-stack:
  added: []
  patterns:
    - "Render-switch view branching (not opacity toggle, not co-existing DOM)"
    - "Auto-fallback effect on derived-state inconsistency (view='playing' + selected===null)"
    - "Top-level component mocks in RTL tests (player + hook) to focus on orchestration"
    - "indexedDB.deleteDatabase in beforeEach for hydration-dependent tests against fresh state"

key-files:
  created:
    - "src/__tests__/meditation-screen.test.tsx"
  modified:
    - "src/components/MeditationScreen.tsx"
    - "src/__tests__/navigation.test.tsx"

key-decisions:
  - "Auto-fallback useEffect deps use [view, selected] (not [view, selectedId, meditations]) — `selected` is derived from all three, so listing it covers the same set of changes with less noise"
  - "handleDelete sets view='library' BEFORE calling remove() so the player unmounts cleanly before the IDB write completes (avoids the player rendering against a record that's about to disappear)"
  - "Inner host wrapper `<div className=\"absolute inset-0 flex flex-col\">` is rendered unconditionally; the outer panel keeps `flex items-center justify-center` per the locked panel root class chain (D-01) — the host overlay lets MeditationLibrary/MeditationPlayer fill the panel without requiring outer-class mutation, so navigation.test.tsx's 3-panel structure assertion passes unchanged"
  - "Player mounts with the selected record passed as a prop (not as state inside MeditationScreen) — single source of truth is `meditations.find(...)` in the screen, so external deletes propagate via the deps without copy-on-select"
  - "Async navigation test (`findByRole`) is required because useMeditationLibrary hydrates from IDB on mount — sync `getByRole` would race the hydration"

requirements-completed: [NAV-01, NAV-02, MEDT-03, MEDT-04, MEDT-08]

duration: ~iOS-checkpoint-pending → resumed
completed: 2026-06-11
---

# Phase 6 Plan 06: MeditationScreen Orchestration + iOS Checkpoint Summary

**One-liner:** Wired the meditation slice into the existing 3-panel shell — MeditationScreen now owns the library hook, branches on view-state, and renders MeditationLibrary or MeditationPlayer; navigation.test.tsx dropped the legacy "Meditate" placeholder assertion; iOS device checkpoint received `approved`.

## Outcome

- `src/components/MeditationScreen.tsx` rewritten as a thin orchestration container. Panel root contract preserved exactly (D-01 panel 2 of 3): `data-panel="meditation"`, `aria-label="Meditation"`, `bg-[#5f7d60]`, `snap-start snap-always`, `w-screen h-dvh`. New attribute `data-view={view}` exposes orchestration state for tests/observability.
- View-state is a render-switch: when `view === 'library'`, `<MeditationLibrary>` renders; when `view === 'playing'` AND `selected !== null`, `<MeditationPlayer>` renders. They never co-exist in the DOM (UI-SPEC §"Component Hierarchy" lines 405–421).
- 7 new integration tests in `src/__tests__/meditation-screen.test.tsx` cover: panel root contract, empty-state default, populated list, tap-to-play transition, back-to-library transition, deleted-while-playing recovery, error toast surfacing.
- `src/__tests__/navigation.test.tsx` updated: legacy `screen.getByText('Meditate')` assertion (D-15 placeholder) replaced with async `findByRole('button', { name: /add meditation/i })` (MEDT-03). `beforeEach` now clears `buho-meditations` IDB so hydration tests start fresh. D-01 (3-panel) and D-02 (default-Landing) assertions retained verbatim.
- Full vitest suite: **157/157 passing** (was 150/150 before this plan added 7 new tests). `npx tsc --noEmit` clean.

## Panel Root Class Adjustments — None Needed

The plan flagged a possible reconciliation between the outer panel's `flex items-center justify-center` (centering for empty state) and the populated state's need for full-bleed flow (`flex flex-col`). Approach taken: rather than mutate the outer class chain (which navigation.test.tsx's 3-panel structure assertion depends on), an inner host wrapper `<div className="absolute inset-0 flex flex-col">` was rendered unconditionally inside the panel. The host overlay fills the panel; MeditationLibrary and MeditationPlayer place themselves inside that host using their own internal layout. No outer panel class was added or removed.

Verified by re-running `npm test -- --run src/__tests__/navigation.test.tsx` after Task 2 — all 6 navigation tests passed first try, including the original 3-panel structure assertion (D-01) and the default-Landing assertion (D-02).

## Deleted-While-Playing Recovery — Effect Shape

```typescript
const selected =
  view === 'playing' && selectedId
    ? meditations.find((m) => m.id === selectedId) ?? null
    : null;

useEffect(() => {
  if (view === 'playing' && !selected) {
    setView('library');
    setSelectedId(null);
  }
}, [view, selected]);
```

Deps are `[view, selected]` rather than the plan's suggested `[view, selectedId, meditations]`. Rationale: `selected` is derived from all three; React re-derives it on every render, so listing `selected` is equivalent in coverage and avoids stale-array deps. Test 6 ("falls back to library if the selected record disappears") verifies the recovery — when the mocked hook's meditations array changes from `[record]` to `[]` mid-test, the screen flips back to `data-view="library"` and unmounts the player.

The companion `handleDelete` short-circuit (`if (id === selectedId) { setView('library'); setSelectedId(null); } void remove(id);`) handles the same scenario via the in-app delete path — the effect is the safety net for external state changes (cross-tab delete, hook-level mutation).

## Test Diff Summary

| File | Lines Δ | What changed |
|------|---------|--------------|
| `src/components/MeditationScreen.tsx` | +97 / -3 | Rewrote placeholder body with view-state orchestration |
| `src/__tests__/navigation.test.tsx` | +6 / -2 | beforeEach IDB cleanup + MEDT-03 assertion swap |
| `src/__tests__/meditation-screen.test.tsx` | +166 / 0 | New file — 7 integration tests |

## TDD Gate Compliance

| Task | RED commit | GREEN commit |
| ---- | ---------- | ------------ |
| 1 (test contract — both files) | `0e83c07` test(06-06): add MeditationScreen view-state tests + drop legacy placeholder assertion (RED) | — |
| 2 (screen rewrite) | — | `ab91528` feat(06-06): rewrite MeditationScreen with view-state branching (GREEN) |

Both commits were made inside an executor worktree and merged into main via `02a6a34 chore: merge executor worktree (worktree-agent-adcf4f021e03508b0) — plan 06-06 tasks 1-2 (pre-checkpoint)` before the iOS device checkpoint.

## iOS Device Smoke Test (Task 3) — Checkpoint Result

User reply (verbatim):

> approved

Per the `<resume-signal>` contract, `approved` means: all verifications A–K pass (or only K shows the documented acceptable limitations). Phase 6 is shippable.

No `block:` items raised. No `defer:` items recorded. No follow-up gap-closure plan needed.

Screenshots / preview link: not captured at the time of approval — if needed for the PR description, capture during the next preview deploy.

## Threat Flags

None. The two STRIDE entries from the plan threat model are mitigated:

| Threat ID | Status | Verification |
|-----------|--------|-------------|
| T-06-14 (view-state desync on deleted record) | Mitigated | Test 6 (`falls back to library if the selected record disappears`) passes |
| T-06-15 (panel root regression) | Mitigated | Test 1 in meditation-screen.test.tsx + the unchanged 3-panel test in navigation.test.tsx both pass |

## Known Stubs

None. Every render path is wired to real hook state (or to the mocked hook in tests with explicit per-test return values). No placeholder copy in the screen body — the legacy "Meditate" `<p>` was deleted in the rewrite.

## Self-Check: PASSED

- [x] `src/components/MeditationScreen.tsx` rewritten — `grep -c "Meditate</p>"` returns 0
- [x] `src/__tests__/meditation-screen.test.tsx` exists with 7 tests
- [x] `src/__tests__/navigation.test.tsx` updated — `grep -c "screen.getByText('Meditate')"` returns 0; `grep -c "Add meditation"` returns ≥1
- [x] `data-panel="meditation"`, `aria-label="Meditation"`, `bg-[#5f7d60]`, `snap-start`, `snap-always` all present on the outer div
- [x] `data-view` attribute exposed for testing (library | playing)
- [x] `useMeditationLibrary`, `<MeditationLibrary`, `<MeditationPlayer` all referenced in MeditationScreen.tsx
- [x] `npm test -- --run` exits 0 with 157/157 tests passing (17 files)
- [x] `npx tsc --noEmit` clean
- [x] Commit `0e83c07` (RED) exists in git log
- [x] Commit `ab91528` (GREEN) exists in git log
- [x] D-01 invariant: 3-panel structure test in navigation.test.tsx still green
- [x] D-02 invariant: default-Landing test in navigation.test.tsx still green
- [x] D-19 invariant: no new touch handlers / gesture code introduced (orchestration only)
- [x] iOS checkpoint reply received: `approved`
- [x] Phase 6 coverage gate met: NAV-01, NAV-02, MEDT-01..MEDT-08 all delivered across plans 06-01..06-06
