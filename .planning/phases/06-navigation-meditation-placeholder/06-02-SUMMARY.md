---
phase: 06-navigation-meditation-placeholder
plan: 02
subsystem: foundation
tags: [dependency, refactor, shared-utility, lib]
requires: []
provides:
  - "idb@8.0.3 dependency available for IndexedDB-backed persistence in subsequent Phase 6 plans"
  - "src/lib/formatTime.ts as the single source-of-truth time formatter (M:SS / H:MM:SS)"
affects:
  - "src/components/CountdownDisplay.tsx (now imports shared formatTime — no behavior change for callers)"
tech_stack:
  added:
    - "idb@8.0.3 (Jake Archibald promise IndexedDB wrapper, ~5KB gz, exact-pinned)"
  patterns:
    - "Shared utility under src/lib/ for cross-module helpers"
    - "TDD RED → GREEN gate sequence enforced at the commit log level"
key_files:
  created:
    - path: "src/lib/formatTime.ts"
      purpose: "Canonical formatter — M:SS for <3600s, H:MM:SS for >=3600s; Math.floor on fractional input"
    - path: "src/__tests__/format-time.test.ts"
      purpose: "9 unit tests covering both branches, padding, fractional input, hour boundary"
  modified:
    - path: "package.json"
      purpose: "Adds idb@8.0.3 (exact, not caret) to dependencies"
    - path: "package-lock.json"
      purpose: "Locks idb@8.0.3 with sha512 integrity hash"
    - path: "src/components/CountdownDisplay.tsx"
      purpose: "Removed local formatTime; imports from ../lib/formatTime"
decisions:
  - "Used --save-exact to pin idb@8.0.3 (no caret) per RESEARCH.md A4 + threat T-06-08 mitigation"
  - "Branch on hours > 0 (not >= 3600) so the predicate stays close to the hours computation"
  - "Math.floor(totalSeconds) at top of function so fractional seconds compute deterministically across all three components (h/m/s)"
metrics:
  duration: "~3min"
  tasks_completed: "2/2"
  tests_added: 9
  tests_total_after: 105
  completed_date: "2026-06-11"
---

# Phase 06 Plan 02: idb dependency + formatTime extraction — Summary

Installed `idb@8.0.3` as an exact-pinned dependency and extracted the inline `formatTime` helper from `CountdownDisplay.tsx` into a new shared `src/lib/formatTime.ts` utility with `H:MM:SS` support, backed by 9 vitest unit cases — both Phase 6 prerequisites in a single Wave 1 plan.

## Objective

Per the plan's `<objective>`: lay the two foundations needed before any IDB or meditation-player code can be written in subsequent Phase 6 plans — (1) the `idb` library (~5KB gz, promise wrapper around IndexedDB by Jake Archibald) and (2) a single `formatTime` utility callable from countdown display, library list rows, and the upcoming player UI.

## Tasks

### Task 1: Install idb 8.0.3 and verify lockfile entry — commit `5cfb5bb`

- Ran `npm install idb@8.0.3 --save-exact` from the repo root.
- `package.json` now contains `"idb": "8.0.3"` (exact, no caret) — verified with `grep -cE '"idb":\s*"8\.0\.3"'` returning 1.
- `package-lock.json` records:
  - `"version": "8.0.3"`
  - `"resolved": "https://registry.npmjs.org/idb/-/idb-8.0.3.tgz"`
  - `"integrity": "sha512-LtwtVyVYO5BqRvcsKuB2iUMnHwPVByPCXFXOpuU96IZPPoPN6xjOGxZQ74pgSVVLQWtUOYgyeL4GE98BY5D3wg=="`
  - `"license": "ISC"`
- Runtime resolution: `node -e "console.log(require('idb/package.json').version)"` prints `8.0.3`.
- Existing 96-test suite still green after install (no regression from new transitive deps).
- Files: `package.json`, `package-lock.json`.

### Task 2: Extract formatTime to src/lib + unit tests + import update — commits `c7ad4af` (RED) → `8101178` (GREEN)

**RED gate (`c7ad4af`)** — Wrote `src/__tests__/format-time.test.ts` with 9 cases targeting `../lib/formatTime` (which did not yet exist). Vitest reported the import failure ("Failed to resolve import") — the canonical RED signal — confirming the tests genuinely depend on the new module rather than silently exercising the old local implementation.

**GREEN gate (`8101178`)** — Created `src/lib/formatTime.ts` and rewired `CountdownDisplay.tsx`. Implementation:

```ts
export function formatTime(totalSeconds: number): string {
  const whole = Math.floor(totalSeconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const ss = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    const mm = minutes.toString().padStart(2, '0');
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}
```

`CountdownDisplay.tsx` change: removed the 5-line local `function formatTime` declaration and added `import { formatTime } from '../lib/formatTime';` at the top of the file. JSX expression `{visible ? formatTime(remainingSeconds) : ''}` is unchanged — pure import-redirection refactor.

**Test cases (`src/__tests__/format-time.test.ts`):**

| Input (s) | Expected | Branch | Verifies |
|-----------|----------|--------|----------|
| 0 | `"0:00"` | M:SS | zero-base |
| 5 | `"0:05"` | M:SS | seconds zero-padding |
| 60 | `"1:00"` | M:SS | exact-minute |
| 65 | `"1:05"` | M:SS | unpadded minutes |
| 754 | `"12:34"` | M:SS | UI-SPEC line 209 example |
| 3600 | `"1:00:00"` | H:MM:SS | hour boundary |
| 3725 | `"1:02:05"` | H:MM:SS | minutes ALSO zero-padded in this branch |
| 7384.6 | `"2:03:04"` | H:MM:SS | Math.floor on fractional input |
| 36000 | `"10:00:00"` | H:MM:SS | 10-hour formatting |

All 9 pass; full repo suite at 105/105 (96 prior + 9 new).

## Verification Results

| Check | Result |
|-------|--------|
| `node -e "console.log(require('idb/package.json').version)"` prints `8.0.3` | PASS |
| `grep -cE '"idb":\s*"8\.0\.3"' package.json` → 1 | PASS |
| `npm test -- --run src/__tests__/format-time.test.ts` exits 0 with 9 passing | PASS |
| `npm test -- --run` exits 0 (full suite green) | PASS — 105/105 |
| `grep -c "function formatTime" src/components/CountdownDisplay.tsx` → 0 | PASS |
| `grep -c "from '../lib/formatTime'" src/components/CountdownDisplay.tsx` → 1 | PASS |
| `grep -c "export function formatTime" src/lib/formatTime.ts` → 1 | PASS |
| `grep -c "padStart(2, '0')" src/lib/formatTime.ts` → ≥ 1 | PASS (returns 2) |
| `npx tsc -b` (TypeScript build) | PASS (no output / no errors) |

## Decisions Made

1. **Exact pin via `--save-exact`** — Plan + RESEARCH.md A4 explicitly require pinning to `8.0.3` (not `^8.0.3`) for supply-chain stability (T-06-08 mitigation). Used the documented `npm install idb@8.0.3 --save-exact` form.
2. **Branch on `hours > 0`, not `totalSeconds >= 3600`** — Both predicates are equivalent after `Math.floor`, but `hours > 0` keeps the conditional adjacent to its computation, easier to follow.
3. **`Math.floor(totalSeconds)` at function entry** — Centralizes the integer-coercion so all three components (h, m, s) compute from the same whole-second basis. Test 8 (`7384.6 → "2:03:04"`) directly exercises this.
4. **Minutes zero-padded in the H branch only** — Per UI-SPEC line 292 ("H:MM:SS") the M is two digits when hours are present; this is what makes `3725 → "1:02:05"` (test 7) work. In the M:SS branch minutes stay unpadded per the locked spec (`12:34` not `12:34`, `0:45` not `00:45`).

## Threat Mitigations Applied

- **T-06-08 (supply chain tampering on `idb` install)** → mitigated. Used `--save-exact`; lockfile records sha512 integrity hash for verification on future `npm ci`.
- **T-06-09 (info disclosure via `formatTime`)** → accepted as planned. Pure function over a numeric input; no IO, no time source, no PII surface.

## Deviations from Plan

None — both tasks executed exactly as specified. No Rule 1/2/3 auto-fixes were needed; the existing test suite remained green at every gate; no blocking issues; no architectural Rule 4 escalations.

## Authentication Gates

None encountered.

## TDD Gate Compliance

- RED commit: `c7ad4af` — `test(06-02): add failing tests for shared formatTime utility (RED)` (tests reference unimplemented module → fail at import)
- GREEN commit: `8101178` — `feat(06-02): extract formatTime to src/lib + H:MM:SS branch (GREEN)` (implementation + import wiring; all 9 + full suite pass)
- REFACTOR: not needed — implementation was already its smallest correct form.

Gate sequence verified in `git log --oneline`.

## Known Stubs

None. `formatTime` is a complete implementation covering both M:SS and H:MM:SS branches; all 9 test cases pass without skips or `it.todo`s.

## Self-Check: PASSED

Verified after writing this SUMMARY:

- `[ -f src/lib/formatTime.ts ]` → FOUND
- `[ -f src/__tests__/format-time.test.ts ]` → FOUND
- `[ -f package.json ]` → FOUND, contains `"idb": "8.0.3"`
- `[ -f package-lock.json ]` → FOUND, contains `"version": "8.0.3"` for `node_modules/idb`
- Commit `5cfb5bb` (Task 1: idb install) → present in `git log`
- Commit `c7ad4af` (Task 2 RED) → present in `git log`
- Commit `8101178` (Task 2 GREEN) → present in `git log`
- Full test suite 105/105 green (96 prior + 9 new)
