---
status: complete
task_id: 260623-goa
slug: apply-the-3-safe-ponytail-cuts
created: 2026-06-23
completed: 2026-06-23
---

# Quick Task: Apply the 3 safe ponytail cuts

## Description

The `ponytail:ponytail-audit` skill surfaced a repo-wide list of over-engineering findings. Three of them are mechanically safe (no behavior change, no API surface that survives outside the file, no planning-artifact references):

1. `delete:` unused `MeditationState` interface in `src/types/meditation.ts:18-22`
2. `delete:` unused `getMeditation()` export in `src/lib/meditationsDB.ts:51-54` (and its caller-less test block in `src/__tests__/meditations-db.test.ts:133-137`, plus the dead mock entry in `src/__tests__/meditation-library.test.tsx:13`)
3. `delete:` single-use `INITIAL_DELAY_MS` constant in `src/hooks/useBreathingAudio.ts:5,100` — inline the `800` literal

## Tasks

- [x] **T1** — Delete `MeditationState` interface from `src/types/meditation.ts`. Run `npm test -- meditation` to confirm no test references it.
- [x] **T2** — Delete `getMeditation()` from `src/lib/meditationsDB.ts`, remove its test in `src/__tests__/meditations-db.test.ts`, and drop the now-unused mock entry from `src/__tests__/meditation-library.test.tsx`. Run `npm test` to confirm green.
- [x] **T3** — Inline `INITIAL_DELAY_MS` constant (`800`) in `src/hooks/useBreathingAudio.ts`. Run `npm test -- breathing-audio` to confirm timer scheduling is unaffected.

## Verification

- `npm run build` — passes (typecheck + bundle).
- `npm test` — all 157 tests still green.

## Out of scope

The other ponytail-audit findings (doctrine comments, `breathingReducer` table-driven shrink, `AddMeditationButton` variant prop, `PageDots.total` prop, `useWakeLock.request` inlining, `stripExtension`/`getFormatFromFilename` reshape) are either load-bearing planning references or have legitimate multi-call-site reasons. Out of scope.
