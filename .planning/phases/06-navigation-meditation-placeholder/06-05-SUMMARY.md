---
phase: 06-navigation-meditation-placeholder
plan: 05
subsystem: meditation-player
tags: [hook, ui, player, howler, wake-lock, vertical-slice]
requires:
  - .planning/phases/06-navigation-meditation-placeholder/06-04-PLAN.md
  - src/hooks/useWakeLock.ts
  - src/types/meditation.ts
  - src/lib/formatTime.ts
  - howler
provides:
  - useMeditationPlayer hook (Howler + wake-lock wrapper)
  - MeditationPlayer component (D-13 minimal player UI)
affects:
  - none (additive only — D-18 invariant respected)
tech-stack:
  added: []
  patterns:
    - Lazy Howl construction inside user gesture (D-17, mirrors useBreathingAudio)
    - Blob URL lifecycle ordering (Pattern 3 — revoke AFTER unload)
    - Wake-lock composition without hook modification (D-16, D-18)
    - StrictMode double-mount guard via useRef (React 19)
    - 250 ms setInterval poll on howl.seek() for elapsed (Pattern 4)
key-files:
  created:
    - src/hooks/useMeditationPlayer.ts
    - src/components/MeditationPlayer.tsx
    - src/__tests__/meditation-player.test.ts
    - src/__tests__/meditation-player.test.tsx
  modified: []
decisions:
  - StrictMode guarded via component-level useRef<boolean> "started" flag — play() runs once across React 19's dev double-effect.
  - Play-disc glow class chosen as conditional-on-isPlaying (shadow-[0_0_30px_8px_rgba(245,240,235,0.4)] when paused, shadow-none when playing) plus active:shadow-none for press-down feedback. Visual state tracks audible state, not just press.
  - Play triangle SVG uses fill="currentColor" (filled glyph). Deliberate exception to UI-SPEC §"Icon SVG" stroke-only convention; UI-SPEC line 210 explicitly calls for a play triangle.
metrics:
  duration: ~7 min
  completed: 2026-06-11
requirements:
  - MEDT-04
  - MEDT-05
  - MEDT-06
  - MEDT-08
---

# Phase 6 Plan 05: Meditation Player Slice (Howler + Wake Lock) Summary

**One-liner:** Howler-backed meditation player with composed wake-lock lifecycle, 96 px ivory play/pause disc, and StrictMode-safe auto-play — completing the library → player vertical slice (MEDT-04/05/06).

## Outcome

- `useMeditationPlayer` hook wraps a single lazily-constructed `Howl` instance per playing meditation. Composes `useWakeLock` (D-16) and reuses Howler's iOS audio-unlock pattern from `useBreathingAudio.start` (D-17). Exposes `play / pause / stop / isPlaying / elapsed / duration` (per `<interfaces>` block).
- `MeditationPlayer` component renders the locked D-13 layout: top-left back chevron, centered title (filename minus extension), `M:SS / M:SS` elapsed/total, 96 px ivory disc with sage play/pause glyph. Composes the hook internally; `onBack` is wired to the hook's `onEnd` so natural-end auto-closes the player (D-15).
- 22 tests pass across the two new test files (13 hook + 9 component); full suite is 150/150 green.
- D-18 invariant verified — `git diff 11bba50..HEAD -- src/hooks/useBreathingAudio.ts src/hooks/useWakeLock.ts` returns 0 lines.

## Component Props

`<MeditationPlayer>` consumes:

| Prop         | Type                | Purpose                                                                    |
| ------------ | ------------------- | -------------------------------------------------------------------------- |
| `meditation` | `MeditationRecord`  | The record to play. Component calls `play(meditation)` exactly once on mount. |
| `onBack`     | `() => void`        | Invoked on back-chevron tap (after `stop()`) AND on natural-end (D-14, D-15). The caller (Plan 06-06) tears down the player view. |

The component does NOT accept the player object as a prop — it owns `useMeditationPlayer` internally so the hook's lifecycle is bound 1:1 to component mount/unmount. Cleanup is handled by the hook's unmount effect (T-06-03 / T-06-04 mitigation).

## Glow Class Decision

Chosen: **conditional-on-`isPlaying`** rather than `active:`-only.

```tsx
className={`mt-12 w-24 h-24 bg-[#f5f0eb] rounded-full ... ${
  isPlaying ? 'shadow-none' : 'shadow-[0_0_30px_8px_rgba(245,240,235,0.4)]'
} active:shadow-none`}
```

Rationale: the glow is the visual cue that the disc is "ready to be tapped" — it should disappear when audio is actually playing (matching the audible state), not just on press. `active:shadow-none` is stacked on top so the press-down feedback still works for both paused→play and play→pause transitions.

## StrictMode Double-Mount Guard

React 19 invokes mount-effects twice in development (StrictMode). Guarded with a `useRef<boolean>(false)` "started" flag inside the component:

```tsx
const startedRef = useRef(false);
useEffect(() => {
  if (startedRef.current) return;
  startedRef.current = true;
  play(meditation);
}, []);
```

The flag persists across the StrictMode "fake-unmount → re-mount" cycle (refs survive the dev re-mount), so `play()` is invoked exactly once. Verified by Test 8 (`mounts under StrictMode without invoking play() twice`).

The hook itself ALSO has a Pitfall-5 mitigation (`if (howlRef.current) stop();` at the top of `play()`), so even if the component guard ever fails, the hook degrades gracefully — the prior session is torn down before a new one starts.

## Test Runtime

- `meditation-player.test.ts` + `meditation-player.test.tsx` together: **916 ms** (transform 143, setup 80, import 242, tests 166, environment 906).
- Full suite: **2.85 s** (16 files, 150 tests).
- TypeScript check (`npx tsc --noEmit`): clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocker] Replaced `vi.stubGlobal('URL', ...)` with `vi.spyOn(URL, ...)`**

- **Found during:** Task 1 GREEN verification — first run of `meditation-player.test.ts`.
- **Issue:** The test scaffold from `<action>` instructed `vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })`. This replaces the entire `URL` global with a 2-key object, which broke Howler's internal `new URL(src[0])` call inside the Howl constructor (`TypeError: URL is not a constructor`). All 13 tests failed before any assertion ran.
- **Fix:** Replaced the wholesale stub with two `vi.spyOn(URL, 'createObjectURL').mockImplementation(...)` calls so the real `URL` constructor stays available. `vi.restoreAllMocks()` in `afterEach` restores the originals between tests.
- **Files modified:** `src/__tests__/meditation-player.test.ts`
- **Commits:** Folded into the GREEN commit (`66a274e`) since the RED commit had already established the test contract; the spy-vs-stub change is an implementation detail of the mocking layer, not a behavior change.

### Auth Gates

None.

### CLAUDE.md Adjustments

None — plan was consistent with project constraints (Tailwind utilities, no new colors, sage `#5f7d60` background canvas, ivory `#f5f0eb` accent disc, inline SVG icons, no animation libs).

## Play-Triangle SVG Exception

UI-SPEC §"Icon SVG Convention" (and `MusicToggle.tsx` / `VoiceToggle.tsx` precedent) locks all icons to stroke-based, `fill="none"`, `strokeWidth="2"`, `strokeLinecap="round"`, `strokeLinejoin="round"`. The play triangle in this player is a **deliberate exception** — `<path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />`. Justification:

1. UI-SPEC line 210 itself specifies "play triangle when paused/idle" — a triangle outline at `strokeWidth="2"` would have visible chevron-stroke joints and look incomplete/fragile.
2. The play-triangle glyph is universally rendered as a filled shape across iOS / macOS / Android / Material / Tailwind UI references; an outlined triangle reads as something else (a "next" affordance, a directional indicator).
3. The pause glyph (two filled rectangles) is also `fill="currentColor"` — keeping the play and pause glyphs in the same fill style means the disc never visually "shifts" when toggling; only the shape changes.
4. Documented as a one-off exception so future icon work doesn't generalize the deviation.

Back-chevron and any future stroke-based icons remain on the standard convention.

## Lifecycle Ordering — Verified

The Pattern 3 invariant ordering (`stop → unload → revokeObjectURL → wakeRelease`) is enforced both in code and in test:

```typescript
// src/hooks/useMeditationPlayer.ts (stop callback)
howl.stop();
howl.unload();
if (url !== null) {
  URL.revokeObjectURL(url);
}
howlRef.current = null;
urlRef.current = null;
setIsPlaying(false);
setElapsed(0);
wakeReleaseRef.current();
```

```typescript
// Test 5 — explicit invocationCallOrder assertion
expect(stopOrder).toBeLessThan(unloadOrder);
expect(unloadOrder).toBeLessThan(revokeOrder);
expect(revokeOrder).toBeLessThan(releaseOrder);
```

This guards T-06-03 (object-URL leak) and T-06-04 (wake-lock leak) per the `<threat_model>` register.

## Threat Flags

None.

## Known Stubs

None — every UI element is wired to real hook state. No placeholder values flow to render.

## TDD Gate Compliance

Both tasks followed the RED → GREEN sequence with separate commits:

| Task | RED commit | GREEN commit |
| ---- | ---------- | ------------ |
| 1 (hook + unit tests) | `ea130e6` test(06-05): add failing useMeditationPlayer hook tests (RED) | `66a274e` feat(06-05): implement useMeditationPlayer hook (GREEN) |
| 2 (component + RTL tests) | `f82b7c2` test(06-05): add failing MeditationPlayer component tests (RED) | `5b0fc03` feat(06-05): implement MeditationPlayer component (GREEN) |

REFACTOR phase was not needed — implementations went through review during writing and required no post-GREEN cleanup pass.

## Self-Check: PASSED

- [x] `src/hooks/useMeditationPlayer.ts` exists (FOUND)
- [x] `src/components/MeditationPlayer.tsx` exists (FOUND)
- [x] `src/__tests__/meditation-player.test.ts` exists (FOUND)
- [x] `src/__tests__/meditation-player.test.tsx` exists (FOUND)
- [x] Commit `ea130e6` exists in git log (FOUND)
- [x] Commit `66a274e` exists in git log (FOUND)
- [x] Commit `f82b7c2` exists in git log (FOUND)
- [x] Commit `5b0fc03` exists in git log (FOUND)
- [x] D-18 invariant: `useBreathingAudio.ts` + `useWakeLock.ts` unchanged from base (verified: 0-line diff)
- [x] `npm test` exits 0 with 150 tests
- [x] `npx tsc --noEmit` exits 0
