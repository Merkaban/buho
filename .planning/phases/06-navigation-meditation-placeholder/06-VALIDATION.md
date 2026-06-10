---
phase: 6
slug: navigation-meditation-placeholder
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-10
updated: 2026-06-10
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Filled by gsd-planner from RESEARCH.md §"Validation Architecture" and the per-task verify blocks across plans 06-01..06-06.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.5 + jsdom 29 + React Testing Library 16.3.2 |
| **Config file** | vite.config.ts (test block) |
| **Quick run command** | `npm test -- --run <relative-test-path>` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~3 seconds for full suite based on Phase 5 baseline; new Phase 6 tests add ~48 cases — projected ~5 seconds total |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run <task-relevant test file>` (per task `<verify>` block).
- **After every plan wave:** Run `npm test -- --run` (full suite).
- **Before `/gsd-verify-work`:** Full suite must be green AND device smoke checkpoint (Plan 06-06 Task 3) must be `approved` or `defer:`-noted.
- **Max feedback latency:** 10 seconds — comfortably under target.

---

## Per-Task Verification Map

| Plan-Task | Files Touched | Automated Verify | Wave 0 Dependency | Manual? |
|-----------|---------------|------------------|-------------------|---------|
| 06-01-T1 | .planning/ROADMAP.md | `grep -c "MEDT-08" .planning/ROADMAP.md` ≥ 1 + 7 other source assertions | n/a (doc-only) | no |
| 06-01-T2 | .planning/REQUIREMENTS.md | `grep -c "^- \[ \] \*\*MEDT-0[1-8]\*\*" .planning/REQUIREMENTS.md` = 8 + 5 other source assertions | n/a (doc-only) | no |
| 06-02-T1 | package.json, package-lock.json | `node -e "require('idb/package.json').version === '8.0.3'"` + `npm test -- --run` (regression) | n/a (no test code) | no |
| 06-02-T2 | src/lib/formatTime.ts, src/components/CountdownDisplay.tsx, src/__tests__/format-time.test.ts | `npm test -- --run src/__tests__/format-time.test.ts` (9 tests) + `npm test -- --run` | self-creates tests | no |
| 06-03-T1 | src/__tests__/meditations-db.test.ts | `npm test -- --run src/__tests__/meditations-db.test.ts` exits non-zero (RED) — 7 tests fail-correctly (added sort-order regression test, Q3 RESOLVED) | n/a (this IS the Wave 0 setup) | no |
| 06-03-T2 | src/types/meditation.ts, src/lib/meditationsDB.ts | `npm test -- --run src/__tests__/meditations-db.test.ts` exits 0 with 7 passing (GREEN) + `npm test -- --run` | satisfied by 06-03-T1 | no |
| 06-04-T1 | src/lib/extractDuration.ts, src/__tests__/extract-duration.test.ts | `npm test -- --run src/__tests__/extract-duration.test.ts` (5 tests) | self-creates tests | no |
| 06-04-T2 | src/hooks/useMeditationLibrary.ts | `npm test -- --run` + `npx tsc --noEmit` (component tests in T4 indirectly exercise hook including the new `adding` boolean) | satisfied by T4 mocked-DB tests | no |
| 06-04-T3 | src/components/MeditationListRow.tsx, src/components/AddMeditationButton.tsx | `npx tsc --noEmit` + `npm test -- --run` (component tests in T4 cover behaviors including outside-tap auto-dismiss + pending state) | satisfied by T4 | no |
| 06-04-T4 | src/components/MeditationLibrary.tsx, src/__tests__/meditation-library.test.tsx | `npm test -- --run src/__tests__/meditation-library.test.tsx` (10 tests — added pending-state test for UI-SPEC line 331 and outside-tap auto-dismiss test for UI-SPEC line 264) + `npm test -- --run` | self-creates tests | no |
| 06-05-T1 | src/hooks/useMeditationPlayer.ts, src/__tests__/meditation-player.test.ts | `npm test -- --run src/__tests__/meditation-player.test.ts` (10 tests) + `npm test -- --run` | self-creates tests | no |
| 06-05-T2 | src/components/MeditationPlayer.tsx, src/__tests__/meditation-player.test.tsx | `npm test -- --run src/__tests__/meditation-player.test.tsx` (9 tests) + `npm test -- --run` | self-creates tests | no |
| 06-06-T1 | src/__tests__/navigation.test.tsx, src/__tests__/meditation-screen.test.tsx | `npm test -- --run src/__tests__/meditation-screen.test.tsx` exits non-zero (RED) — 7 tests fail-correctly | n/a (this IS the Wave 0 setup for orchestration) | no |
| 06-06-T2 | src/components/MeditationScreen.tsx | `npm test -- --run src/__tests__/meditation-screen.test.tsx` (7 GREEN) + `npm test -- --run src/__tests__/navigation.test.tsx` (6 GREEN) + `npm test -- --run` (full suite) | satisfied by 06-06-T1 | no |
| 06-06-T3 | (manual checkpoint, no files) | n/a | n/a | **YES — iOS device smoke** |

**Sampling continuity check:** No three consecutive tasks lack an automated verify. Doc-only tasks (06-01-T1, 06-01-T2) have source-assertion verifies; install task (06-02-T1) has both a node-eval verify AND a regression run. No watch-mode flags anywhere.

---

## Wave 0 Requirements

All RED-state test files are written by their owning plans (TDD pattern: write failing tests first, then implement). No "scaffold-only" wave is needed because each implementation plan owns the test scaffold for its own surface:

- [x] **Defined in 06-03-T1:** `src/__tests__/meditations-db.test.ts` — IDB CRUD round-trip + descending-sort (2-record + 3-record regression) + delete + persist + duplicate-rejection (7 tests)
- [x] **Defined in 06-04-T1:** `src/__tests__/extract-duration.test.ts` — File → finite duration with Infinity fallback (5 tests)
- [x] **Defined in 06-04-T4:** `src/__tests__/meditation-library.test.tsx` — empty/populated/loading/add/delete-confirm/error-toast/pending-state/outside-tap-auto-dismiss (10 tests)
- [x] **Defined in 06-05-T1:** `src/__tests__/meditation-player.test.ts` — Hook unit tests with mocked Howler + wake-lock (10 tests)
- [x] **Defined in 06-05-T2:** `src/__tests__/meditation-player.test.tsx` — Component RTL tests (9 tests)
- [x] **Defined in 06-06-T1:** `src/__tests__/meditation-screen.test.tsx` — View-state branching + panel root (7 tests) AND `src/__tests__/navigation.test.tsx` rewrite (replaces legacy "Meditate" assertion)

**Total new test cases authored in Phase 6:** ~48 unit + integration tests across 6 files (was ~45; +1 sort-order regression in `meditations-db.test.ts`, +2 UI-SPEC compliance tests in `meditation-library.test.tsx`).

**Mock strategy** (per RESEARCH.md §"Wave 0 Gaps" lines 663–664):
- `meditations-db.test.ts`: real `idb` calls in jsdom 29; `indexedDB.deleteDatabase('buho-meditations')` per test + `vi.resetModules()` to flush memoized `dbPromise`.
- `meditation-library.test.tsx`, `meditation-screen.test.tsx`: mock `meditationsDB.ts` (vi.mock) so component tests don't hit real IDB.
- `meditation-player.test.ts`: mock `howler` module returning a stub Howl class; mock `useWakeLock` returning `{ activate: vi.fn(), release: vi.fn() }`.
- `meditation-player.test.tsx`: mock `useMeditationPlayer` directly; the hook's internals are covered by `meditation-player.test.ts`.
- `meditation-screen.test.tsx`: mock `useMeditationLibrary` AND `MeditationPlayer` (player's internals covered by player tests; screen tests focus on orchestration).

---

## Manual-Only Verifications

These are owned by Plan 06-06 Task 3 (`checkpoint:human-verify`). The full step list is in Plan 06-06; this table summarizes per-requirement coverage:

| Behavior | Requirement | Why Manual | Owner |
|----------|-------------|------------|-------|
| iOS Files-sheet surfaces audio/* (not DRM Music app) | MEDT-01 | Real iOS Files behavior cannot be reproduced in jsdom (RESEARCH.md A1, Q1 RESOLVED — defer to device test) | Plan 06-06 Task 3, step C |
| Voice Memos `.m4a` upload + duration extraction on iOS | MEDT-01 | iOS-specific media metadata behavior | Plan 06-06 Task 3, step C+D |
| Howler + Blob URL playback on iOS Safari | MEDT-04, MEDT-05 | iOS Safari audio quirks (autoplay, AudioContext state) only on real device (RESEARCH.md A2) | Plan 06-06 Task 3, step F |
| Wake lock active during playback (screen does not lock) | MEDT-06 | Screen-lock behavior is environmental (RESEARCH.md Q4 RESOLVED — Phase 4 carryover, verify on device) | Plan 06-06 Task 3, step G |
| Auto-stop on natural end | MEDT-05 (D-15) | Time-based behavior best confirmed end-to-end on device | Plan 06-06 Task 3, step H |
| IndexedDB persistence across PWA force-quit + reopen | MEDT-02 | Real PWA persistence with browser quota policy is environmental (RESEARCH.md Pitfall 3) | Plan 06-06 Task 3, step E |
| 3-panel swipe still works post-rebuild | NAV-01, NAV-02 | Native scroll-snap behavior on iOS Safari | Plan 06-06 Task 3, step A |
| Aesthetic continuity + VoiceOver announcements | MEDT-08 | Visual + accessibility verification by human | Plan 06-06 Task 3, step J |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are explicit checkpoints (06-06-T3 only)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (verified above)
- [x] Wave 0 covers all MISSING references (test files authored by their owning plans in TDD-RED-then-GREEN sequence)
- [x] No watch-mode flags
- [x] Feedback latency < 10s (full suite ≈ 5s on Phase 5 hardware)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved-by-planner-2026-06-10
