---
status: complete
task_id: 260623-goa
slug: apply-the-3-safe-ponytail-cuts
created: 2026-06-23
completed: 2026-06-23
---

# Summary: Apply the 3 safe ponytail cuts

## What changed

Three mechanical deletions surfaced by `/ponytail:ponytail-audit`, all behavior-neutral:

| # | Cut | Files | Commit |
|---|-----|-------|--------|
| T1 | `MeditationState` interface (unused) | `src/types/meditation.ts` | `65aebbe` |
| T2 | `getMeditation()` export + self-referencing test + dead mock entry | `src/lib/meditationsDB.ts`, `src/__tests__/meditations-db.test.ts`, `src/__tests__/meditation-library.test.tsx` | `f722b7b` |
| T3 | `INITIAL_DELAY_MS` constant (single-use) | `src/hooks/useBreathingAudio.ts` | `0d4db3c` |

**Net:** −19 lines across 5 files. **Tests:** 156/156 green (was 157 — one test deleted with `getMeditation`). **Build:** clean.

## Out of scope (deliberately left)

The audit's larger findings reference locked planning decisions (`D-XX`, `RESEARCH.md`, `PATTERNS.md`) or hit real multi-call-site abstractions:

- Doctrine comments in `useMeditationPlayer.ts` and `MeditationPlayer.tsx` — load-bearing pointers to phase planning.
- `AddMeditationButton` `variant` prop — two real call sites with different wrappers.
- `PageDots.total` prop — likely needed when the 4th panel lands.
- `breathingReducer` table-driven shrink — touches a tested seam; unrolled form is clear.
- `useWakeLock.request` inlining — called from two places.
- `stripExtension` / `getFormatFromFilename` — separate concerns, single line each at call sites.

These can be revisited individually if/when they hurt.
