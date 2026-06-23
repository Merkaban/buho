---
phase: 06
phase_name: "navigation-meditation-placeholder"
project: "mindfulONE"
generated: "2026-06-12"
counts:
  decisions: 16
  lessons: 8
  patterns: 9
  surprises: 6
missing_artifacts:
  - "*-VERIFICATION.md (Phase 6 had no verification artifact — gating done by manual iOS smoke test in 06-06 Task 3)"
  - "*-UAT.md (no formal UAT artifact — checkpoint reply 'approved' served as user acceptance, recorded verbatim in 06-06-SUMMARY.md)"
---

# Phase 6 Learnings: Navigation & Meditation Placeholder

## Decisions

### Lock requirement IDs in a doc-only Wave 1 plan before any code
Phase 6 opened with `06-01-PLAN` rewriting ROADMAP/REQUIREMENTS to replace 2 obsolete MEDT placeholders with the 8-ID functional set MEDT-01..MEDT-08. Subsequent code plans referenced these locked IDs in their `requirements:` frontmatter.

**Rationale:** Stable requirement IDs are a precondition for downstream traceability. Pinning them first means later plans can cite IDs without churn; copy was taken verbatim from RESEARCH.md and CONTEXT.md to avoid wording drift.
**Source:** 06-01-SUMMARY.md

---

### Pin idb to 8.0.3 with `--save-exact` (not caret)
`npm install idb@8.0.3 --save-exact`; `package.json` records `"idb": "8.0.3"`, lockfile records sha512 integrity hash.

**Rationale:** Supply-chain stability. RESEARCH.md A4 + threat T-06-08 mitigation. Exact pinning prevents transitive surprises on `npm ci`.
**Source:** 06-02-SUMMARY.md

---

### Single source-of-truth `formatTime` under `src/lib/`
Extracted the inline `formatTime` from `CountdownDisplay.tsx` into `src/lib/formatTime.ts` with both M:SS and H:MM:SS branches; CountdownDisplay reduced to a one-line import.

**Rationale:** Three Phase 6 surfaces (countdown, library row duration, player elapsed/total) need the same formatter — better one canonical helper than three drifting copies.
**Source:** 06-02-PLAN.md, 06-02-SUMMARY.md

---

### Branch on `hours > 0`, not `totalSeconds >= 3600`; `Math.floor` once at function entry
`formatTime` floors `totalSeconds` once at the top, then derives hours/minutes/seconds from the same whole-second basis. Hour-branch predicate uses `hours > 0` so it lives next to its computation.

**Rationale:** Centralizes integer coercion; `7384.6 → "2:03:04"` exercises the fractional-input invariant. `hours > 0` is more readable than the equivalent `>= 3600` literal.
**Source:** 06-02-SUMMARY.md

---

### Lock IDB schema first (Wave 2), before any UI plan consumes it
`06-03-PLAN` shipped `MeditationRecord` type + `meditationsDB` (4-op CRUD) + 7 vitest cases including a 3-record non-monotonic-insertion sort regression — all before any library or player UI work began.

**Rationale:** Goal-backward planning. MEDT-02 ("uploaded meditations persist locally across app restarts") is the requirement that's hardest to verify retroactively; ship its data-layer contract with explicit round-trip tests in Wave 2 so every later plan stands on a verified foundation.
**Source:** 06-03-PLAN.md, 06-03-SUMMARY.md

---

### Sort newest-first via `getAllFromIndex(...).reverse()` (not reverse-cursor, not in-memory sort)
The library lists newest-first (descending by `addedAt`). Implementation: `(await db.getAllFromIndex(STORE, 'addedAt')).reverse()`.

**Rationale:** Both reverse-cursor and `.sort((a,b) => b.addedAt - a.addedAt)` produce the same result, but the index already orders the records — re-sorting is O(n log n) wasted work, and a manual reverse-cursor adds drain logic for no correctness gain. The chosen path is also the verbatim Pattern 1 from RESEARCH.md.
**Source:** 06-03-SUMMARY.md

---

### `db.add` (not `db.put`) so duplicate ids reject
`addMeditation(record)` calls `db.add(STORE, record)` — `add` rejects on key collision, `put` would overwrite silently.

**Rationale:** Test 6 in `meditations-db.test.ts` requires duplicate-id rejection; the keyPath uniqueness guarantee is part of the data-layer contract that the upper layers rely on.
**Source:** 06-03-SUMMARY.md

---

### Per-test `IDBFactory` swap, not `deleteDatabase` alone
Test setup runs `globalThis.indexedDB = new IDBFactory()` in `beforeEach`, then calls `deleteDatabase` as belt-and-braces.

**Rationale:** `deleteDatabase` blocks indefinitely on open connections. Even with `vi.resetModules()`, prior module instances may hold connections. Swapping the entire factory is a clean total reset and side-steps the blocking problem.
**Source:** 06-03-SUMMARY.md

---

### Soften strict `instanceof Blob` assertion in jsdom IDB tests
`Test 1` (round-trip) asserts `expect(list[0]).toHaveProperty('blob')` instead of `toBeInstanceOf(Blob)` plus byte-fidelity. Inline comment documents the limitation and points to Plan 06-06's manual smoke test.

**Rationale:** jsdom 29 + fake-indexeddb does not faithfully structured-clone Blobs (returns a placeholder `{}` on the read side). Trying to over-specify the assertion in unit tests creates false confidence; binding gate for byte-fidelity is the on-device checkpoint.
**Source:** 06-03-SUMMARY.md

---

### Single-string `error`, not an error array, on `useMeditationLibrary`
Hook return is `{ meditations, hydrated, adding, add, remove, error, dismissError }` — `error: string | null`, single message at a time.

**Rationale:** UI shows one toast at a time per UI-SPEC line 332. Single-line strings ("Not enough storage", "Could not read file") fit a 360px viewport without truncation; queuing multiple errors would add complexity for no UX gain.
**Source:** 06-04-SUMMARY.md

---

### `MeditationLibrary` is props-driven (no internal hook)
The container takes `{ meditations, hydrated, adding, error, onAdd, onSelect, onDelete, onDismissError }`; the hook is composed at the screen layer (`MeditationScreen`).

**Rationale:** Lets RTL tests exercise empty/populated/loading/error/adding branches via props alone — no IDB mocking at the hook layer. Keeps the container pure and the hook independently testable.
**Source:** 06-04-SUMMARY.md

---

### `<div role="button">` row, not nested `<button>`
`MeditationListRow` wraps the row content in `<div role="button" tabIndex={0}>` with an `onKeyDown` for Enter/Space; the trash glyph remains a real `<button>`.

**Rationale:** Nesting `<button>` inside `<button>` is invalid HTML and triggers React warnings. PATTERNS.md originally showed nested buttons; the planner caught it and the executor implemented the role-pattern with keyboard semantics preserved.
**Source:** 06-04-SUMMARY.md

---

### `pending=adding` flag opens at top of `add()` and closes in `finally`
`useMeditationLibrary.add(file)` sets `setAdding(true)` synchronously on entry; `setAdding(false)` runs in `finally` regardless of which path resolves/rejects.

**Rationale:** AddMeditationButton must transition to `Adding…` synchronously on file selection and revert reliably whether duration extraction rejects, IDB throws, or the happy path resolves. The button never sticks.
**Source:** 06-04-SUMMARY.md

---

### Glow class on the play disc tracks `isPlaying`, not `:active`
`MeditationPlayer` disc uses `${isPlaying ? 'shadow-none' : 'shadow-[0_0_30px_8px_rgba(245,240,235,0.4)]'}` plus `active:shadow-none` stacked on top.

**Rationale:** Glow is the visual cue that the disc is "ready to be tapped" — it should disappear when audio is actually playing (matching the audible state), not just on press. `active:` provides the press-down feedback for both transitions.
**Source:** 06-05-SUMMARY.md

---

### StrictMode double-mount guard via component-level `useRef<boolean>` "started" flag
```tsx
const startedRef = useRef(false);
useEffect(() => {
  if (startedRef.current) return;
  startedRef.current = true;
  play(meditation);
}, []);
```
Refs survive the dev-mode fake-unmount → re-mount cycle, so `play()` runs exactly once.

**Rationale:** React 19 StrictMode invokes mount-effects twice in development. Without the guard, `play()` would fire twice, race-condition the Howler instance, and double-acquire the wake lock.
**Source:** 06-05-SUMMARY.md

---

### Render-switch (not opacity toggle) for library ⇆ player view branching
`MeditationScreen` renders `<MeditationLibrary>` OR `<MeditationPlayer>`; they never co-exist in the DOM. Plus an inner host wrapper `<div className="absolute inset-0 flex flex-col">` lets either child fill the panel without mutating the locked outer panel class chain.

**Rationale:** UI-SPEC §"Component Hierarchy" lines 405–421 specifies a render-switch. Co-existing DOM would mean the player's Howler instance keeps state when the user is back in library, defeating the unmount-cleanup contract. The host-wrapper approach preserves D-01 (3-panel) test assertions without classname churn.
**Source:** 06-06-SUMMARY.md

---

## Lessons

### jsdom 29 ships without IndexedDB despite RESEARCH.md claiming otherwise
RESEARCH.md §"Wave 0 Gaps" line 663 said "jsdom 29 includes a working IndexedDB implementation". Empirically false — `typeof globalThis.indexedDB === 'undefined'` in jsdom 29.1.1. All 7 IDB tests failed with `ReferenceError`. Fix: install `fake-indexeddb@^6.2.5` as devDep and add `'fake-indexeddb/auto'` to vitest `setupFiles`.

**Context:** Discovered during Task 2 GREEN run of plan 06-03. Trust environment claims in research notes only after probing — for any new platform API, run a one-line `typeof globalThis.X` probe before architecting tests around it.
**Source:** 06-03-SUMMARY.md

---

### `vi.stubGlobal('URL', { ... })` breaks Howler's internal `new URL(src[0])`
The plan's test scaffold suggested `vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })` — this replaces the entire `URL` global with a 2-key object. Howler's constructor calls `new URL(...)` and threw `TypeError: URL is not a constructor`. All 13 hook tests failed.

**Context:** Plan 06-05 Task 1 first GREEN run. Fix: switched to `vi.spyOn(URL, 'createObjectURL').mockImplementation(...)` so the real URL constructor stays available. Stubbing globals is dangerous when other libraries use real members of that global.
**Source:** 06-05-SUMMARY.md

---

### Worktree `node_modules/` may start empty even when host has packages installed
First `npm test` invocation in plan 06-04's executor worktree failed with `Cannot find module fake-indexeddb/auto`. The worktree's `node_modules/` started essentially empty (only a `.vite` cache).

**Context:** Resolution was a single `npm install` to populate the worktree (526 packages). Not a code issue, but a setup gotcha to anticipate when working in fresh executor worktrees — first command in a code-changing task should ensure deps are present.
**Source:** 06-04-SUMMARY.md

---

### Pre-commit hook prefers worktree commits to be merged through a chore commit
The phase used the worktree-isolation pattern: each plan ran in `worktree-agent-<hash>` and merged back to main via `chore: merge executor worktree (...) — plan XX` commits. Recent git log shows this for 06-03, 06-04, 06-05, and 06-06.

**Context:** Establishes the durable workflow for this repo: plan branches stay isolated, merges are explicit, and the merge commit message names the plan + worktree id for traceability.
**Source:** git log (referenced from STATE.md and per-plan SUMMARYs)

---

### Manual checkpoint is the binding gate for iOS-Safari-only behaviors
RESEARCH.md flagged Assumption A1 (file picker → iOS Files sheet, NOT Music DRM picker) and A2 (Howler + Blob URL on iOS Safari). Neither is verifiable in jsdom. Plan 06-06's `<task type="checkpoint:human-verify" gate="blocking">` made the on-device smoke test the formal gate.

**Context:** For PWA-only-on-iOS apps, accept that some quality bars only resolve at the device. Designing every plan with an explicit checkpoint task whose `<resume-signal>` accepts `approved | block: ... | defer: ...` keeps the gate documented and the reply auditable.
**Source:** 06-06-PLAN.md, 06-06-SUMMARY.md

---

### Strict Blob `instanceof` checks are unreliable across jsdom + fake-indexeddb
`expect(blob).toBeInstanceOf(Blob)` after a structured-clone round-trip fails in jsdom: fake-indexeddb returns a placeholder `{}` on the read side. Tests had to soften to `toHaveProperty('blob')` and document that byte-fidelity is verified on-device.

**Context:** Plan 06-03 Test 1. When over-specifying tests in jsdom would create false confidence about iOS behavior, write the looser assertion + an inline comment naming the on-device verification surface.
**Source:** 06-03-SUMMARY.md

---

### Single-file file-picker flow needs `input.value = ''` reset
Without resetting the input's value after a file is picked, re-selecting the same file does not fire `onChange` again — Pitfall 6 from research. AddMeditationButton resets via `e.target.value = ''` in `onChange`.

**Context:** Plan 06-04 Task 3. iOS Files sheet may legitimately be the only path the user has to re-import a corrected version of the same filename; without the reset, the second pick is a silent no-op.
**Source:** 06-04-SUMMARY.md

---

### Blob URL revoke ordering matters for memory cleanup
`stop → unload → revokeObjectURL → wakeRelease` is the verified ordering in `useMeditationPlayer`'s stop callback. Test 5 in the hook test file uses `invocationCallOrder` assertions to lock the sequence.

**Context:** Reversing revoke before unload risks Howler holding a reference to a freed URL; releasing the wake lock before stop releases it before the audio actually stops. Pattern 3 (Blob URL lifecycle) from RESEARCH.md was followed verbatim.
**Source:** 06-05-SUMMARY.md

---

## Patterns

### Doc-only Wave 1 plan that locks requirement IDs before any code
A first plan in a phase that only edits ROADMAP/REQUIREMENTS (and possibly CONTEXT) to lock requirement IDs and success criteria. Code plans in later waves cite these IDs in `requirements:` frontmatter.

**When to use:** Whenever a phase changes the requirement set (rewriting placeholders, splitting a requirement, adding new IDs). Lock the IDs as a doc-only commit so downstream plans don't churn references.
**Source:** 06-01-SUMMARY.md

---

### Goal-backward Wave 2 — ship the data-layer contract before any UI
Plan 06-03 shipped types + IDB CRUD + 7 round-trip tests (including the 3-record non-monotonic-insertion sort regression) before any library or player plan started.

**When to use:** When a phase has a "must persist across restart" requirement (or similar invariant that's hard to retrofit-test). Lock the data layer first so every later plan stands on a verified foundation.
**Source:** 06-03-PLAN.md

---

### Cancelled-flag idiom for async useEffect hydration
```ts
useEffect(() => {
  let cancelled = false;
  (async () => {
    const data = await load();
    if (cancelled) return;
    setState(data);
  })();
  return () => { cancelled = true; };
}, []);
```

**When to use:** Any hook that hydrates state from IDB / fetch / async source on mount. Prevents state writes after unmount when StrictMode (or rapid re-mount) double-runs the effect. First use in this repo: `useMeditationLibrary`.
**Source:** 06-04-SUMMARY.md

---

### Outside-tap auto-dismiss via gated `document.pointerdown` listener
`MeditationListRow` attaches a `document.pointerdown` listener via `useEffect` keyed on `confirming`. Listener checks `rowRef.current?.contains(target)`; clears confirming on outside tap. Listener is removed in cleanup.

**When to use:** Any inline confirmation / popover that should dismiss on outside-tap. Gating on the active state means the document-wide cost is only paid during the brief confirm window. `pointerdown` covers both touch and mouse with one handler — no need for separate `touchstart`/`mousedown`.
**Source:** 06-04-SUMMARY.md

---

### Props-driven container + hook composed by parent screen
`MeditationLibrary` takes the hook return shape as props (no internal hook); `MeditationScreen` composes `useMeditationLibrary` and forwards. Same shape for `MeditationPlayer` (props: `meditation` + `onBack`; the hook is composed by the screen indirectly via the player's own internal hook usage).

**When to use:** When a container component must be testable across many states (empty / populated / loading / error / adding). Pass the state as props; let the parent screen own the hook.
**Source:** 06-04-SUMMARY.md, 06-06-SUMMARY.md

---

### Lazy Howl construction inside the user gesture for iOS audio unlock
`useMeditationPlayer.play(meditation)` constructs a fresh `Howl` on the user-gesture-driven play call (mirrors `useBreathingAudio.start`). No Howl instance exists at hook-mount time.

**When to use:** Any audio playback on iOS Safari that requires the autoplay-restriction unlock. Never pre-construct audio at component mount; defer to the user gesture.
**Source:** 06-05-SUMMARY.md

---

### StrictMode double-mount `useRef` guard for "run-once" mount effects
A `useRef<boolean>(false)` "started" flag at the component level, set inside the mount effect. Refs survive the dev fake-unmount → re-mount cycle, so the guarded action runs exactly once.

**When to use:** Any mount effect that does work which must not be re-entered (start audio playback, acquire wake lock, send analytics, etc.). React 19 StrictMode double-mounts in development.
**Source:** 06-05-SUMMARY.md

---

### Render-switch view branching with auto-fallback effect for state desync
View state is `'library' | 'playing'`; render returns one component or the other, never both. A `useEffect` watches the derived `selected` value: if `view === 'playing' && !selected`, the effect resets to `'library'`.

**When to use:** Any orchestration container with view modes that depend on a record from a list which can change underneath (delete-while-playing, cross-tab edit, hook-level state mutation). The fallback effect is the safety net for external state changes.
**Source:** 06-06-SUMMARY.md

---

### Inner host wrapper preserves locked outer panel class chain
The outer panel keeps `flex items-center justify-center` (locked by D-01 navigation tests). An inner `<div className="absolute inset-0 flex flex-col">` host overlays the panel and lets full-bleed children render without requiring outer-class mutation.

**When to use:** Any panel with a locked outer-class chain (per a test or design contract) where some child states need a different layout (e.g. centered empty state vs. full-bleed populated list). Add a host wrapper rather than mutating the outer.
**Source:** 06-06-SUMMARY.md

---

## Surprises

### RESEARCH.md said jsdom ships IndexedDB; it does not
A confident research claim (RESEARCH.md §"Wave 0 Gaps" line 663) turned out to be empirically wrong. Tests failed with `ReferenceError: indexedDB is not defined` and required `fake-indexeddb` to be added as a devDep mid-plan.

**Impact:** Triggered an auto-fix (Rule 3 Blocker) inside plan 06-03 that added a new devDep + setupFile entry. No plan-time delay, but it shifted the test-environment surface area. Lesson: probe new platform APIs in jsdom before designing tests around them.
**Source:** 06-03-SUMMARY.md

---

### `deleteDatabase` blocks indefinitely if any prior connection is open
Even with `vi.resetModules()` between tests, the previous test's module instance held an open IDB connection that `deleteDatabase` waited on. The hook timed out at 10s.

**Impact:** Forced the per-test `IDBFactory` swap pattern. Ended up cleaner — full universe reset is more robust than trying to drain connections.
**Source:** 06-03-SUMMARY.md

---

### Stubbing the entire `URL` global breaks Howler's internal `new URL(...)`
`vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })` looked correct in isolation; in practice, Howler's constructor calls `new URL(src[0])`, which threw `TypeError: URL is not a constructor`.

**Impact:** All 13 player-hook tests failed before any assertion ran. Fix was switching to `vi.spyOn(URL, 'createObjectURL')` so the real constructor stays available. Lesson: stubbing high-level globals is dangerous when third-party libs use other members of that global.
**Source:** 06-05-SUMMARY.md

---

### jsdom Blob round-trip through fake-indexeddb returns a placeholder, not a Blob
`expect(blob).toBeInstanceOf(Blob)` failed because fake-indexeddb's structured-clone read side returns `{}` for jsdom Blobs.

**Impact:** Test 1 had to soften to `toHaveProperty('blob')` and document inline that byte-fidelity is bound by Plan 06-06's iOS device checkpoint. Did not affect production correctness — real iOS Safari round-trips blobs faithfully.
**Source:** 06-03-SUMMARY.md

---

### Worktree `node_modules/` started empty
First `npm test` in plan 06-04's executor worktree failed because `node_modules/` was essentially empty (only a `.vite` cache). Required `npm install` to populate 526 packages before tests would run.

**Impact:** Brief setup delay; not a code issue. Lesson: in fresh executor worktrees, the first command of a code-changing task should ensure deps are present.
**Source:** 06-04-SUMMARY.md

---

### Phase 6 went from 0% → 100% on a single calendar day
ROADMAP/STATE timestamps show 06-01 through 06-06 all completed on 2026-06-11 (with the iOS checkpoint approved that same day). Per-plan durations are tiny (3–7 min each) thanks to tight wave dependencies, locked specs, and TDD gates that caught mistakes early.

**Impact:** Validated the GSD workflow's wave-based planning + TDD gate enforcement. Also surfaced the auto-fix pattern (Rule 3 Blockers were resolved within the plan, not deferred) — three blockers in plan 06-03 alone, all resolved without escalating.
**Source:** 06-01..06-06 SUMMARYs (timestamps + duration fields)
