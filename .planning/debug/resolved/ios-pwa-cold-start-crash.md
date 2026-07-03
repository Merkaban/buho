---
slug: ios-pwa-cold-start-crash
status: resolved
trigger: |
  iOS Safari PWA crashes on cold start with "website crashed" overlay when an 18.7 MB
  meditation mp3 is in IndexedDB. Confirmed reproducible: tested by adding mp3, fully
  swiping app closed via app switcher, re-launching from home-screen icon — crashes
  every time with overlay "Auf 'https://buho-drab.vercel.app/' ist wiederholt ein
  Problem aufgetreten" (Safari's "website crashed" page).
created: 2026-06-29
updated: 2026-07-03
---

## STATUS 2026-07-03c (H3 CONFIRMED via on-device safe-boot log readback — fix applied)

**H3 CONFIRMED (delayed-kill variant).** Full boot log read back on-device via the
safe-boot viewer:

```
1783105044801 main.tsx loaded            <- boot 1 (fresh install): full render, listMeditations resolved n=0, ~13s healthy session (add mp3, play)
1783105063330 main.tsx loaded            <- boot 2: user cold relaunch
1783105063393-63407 all three screens render() entered
1783105063418 useMeditationLibrary: listMeditations() called
1783105063450 useMeditationLibrary: listMeditations() resolved n=1
1783105063569 main.tsx loaded            <- boot 3, only 239ms after boot 2 = WebKit auto-reload after renderer kill
1783105063626 listMeditations() called
1783105063636 resolved n=1
                                          <- dies again ~100ms later
1783105066644 main.tsx loaded
1783105066644 main.tsx SAFE MODE (crash count 2)
```

**Interpretation:** Both crashed boots complete module eval, full render entry, AND
the IDB read (`resolved n=1`). They die ~100-120ms AFTER `resolved n=1`. The only
delta vs the healthy boot 1 is n=1 (blob present). This is H3 in its DELAYED-kill
form: `getAllFromIndex` structured-clones the 18.7 MB blob into the heap (the JS
strip happens only AFTER the clone completes), and the iOS jetsam memory watchdog
kills the renderer ASYNCHRONOUSLY moments after the allocation spike — which is why
"resolved" logs before death. Cold-start memory budget is tighter than in-session,
which is why boot 1's playback survived. Images / SW / React tree are identical
across healthy and crashing boots → exonerated as the kill trigger.

**H5 (splash/image decode) and H6 (SW activation timing) ELIMINATED as the kill
trigger:** both crashed boots run JS all the way through the IDB read, so the
renderer is demonstrably alive well past the pre-JS splash/SW phase. The safe-boot
viewer DID appear (crash count 2), proving JS executes — the PRE-JS-DEATH caveat
did not fire.

**Fix applied this cycle:** object-store split — `meditations-meta` (id, filename,
duration, addedAt) + `meditations-blobs` (id → blob). `listMeditations()` reads ONLY
the meta store, so the 18.7 MB blob is never structured-cloned on cold start.
`getMeditationBlob(id)` lazily reads the blob store. See Resolution below.


## STATUS 2026-07-03b (safe-boot viewer landed, awaiting on-device readback via on-screen log)

**Why:** On-device Web Inspector readback FAILED. Every relaunch after the crash
also crashes, so there is never a live app context to attach the inspector to.
Attaching to the crash overlay itself throws `SecurityError: The operation is
insecure` (opaque `data:` origin). The boot log cannot be read via inspector at
all. Decision (user): implement an on-screen "safe boot" crash-loop viewer.

**Implemented (commit `4ea30fb`, local only — NOT pushed, NOT deployed):**
`chore(debug): safe-boot log viewer for crash-loop readback`.

- New `src/lib/safeBoot.ts` (dependency-free vanilla DOM):
  - `registerBootAndCheckCrashLoop()` reads `buho-crash-count` from localStorage,
    increments and persists it immediately, schedules
    `setTimeout(() => set count '0', 5000)` (a boot that survives 5 s is healthy),
    and returns `inCrashLoop` = pre-increment count >= 2. localStorage wrapped in
    try/catch, consistent with bootLog.ts.
  - `renderSafeModeViewer(root, count)` renders a plain `<pre>` of `buho-boot-log`
    (plus crash count) into `#root` with a "Continue anyway" button that clears the
    counter and calls `location.reload()`. No React in safe mode.
- `src/main.tsx` restructured: safe-boot check runs at the very top, BEFORE any
  App module-eval. App is gated behind a dynamic `import('./App')` (with
  `react` / `react-dom/client` also dynamic) so App's module graph stays entirely
  out of safe mode. Confirmed by build output: App split into its own 66 kB chunk,
  entry chunk is 4.74 kB.
- New test `src/__tests__/safe-boot.test.ts` (7 cases): increment, no-loop on first
  two boots, loop at threshold >= 2, healthy reset after 5 s (fake timers), corrupt
  count tolerance, viewer renders log + button, empty-log placeholder.

**Verification:** `npx tsc --noEmit` clean; `npx vitest run` 18 files / 164 tests
passing; `npm run build` produces production bundle (652 KiB precache, 17 entries).

**PRE-JS-DEATH CAVEAT (diagnostic signal):** if the crash happens before ANY JS
runs (iOS splash chain H5 / SW-activation H6 territory), the crash counter never
increments and safe mode never triggers. In that case the crash overlay persists
with NO safe-mode screen even after 2+ crashed relaunches — that outcome is itself
a diagnostic signal that the renderer dies before JS executes at all (⇒ pre-JS
death, points at H5/H6, not H3). Report that outcome explicitly if observed.

**Awaiting human-action:** on-device readback via the on-screen safe-mode screen
(see checkpoint). The last log line of each boot attempt selects the surviving
hypothesis per the decision table.

## STATUS 2026-07-03 (committed, awaiting on-device boot-log readback)

All three attempts are now committed to `main` (local only — NOT pushed, NOT
deployed). Verified before committing: `npx tsc --noEmit` clean; `npx vitest run`
17 files / 157 tests passing.

- `6dbca98` refactor(meditation): lazy-blob load — Attempt 1 (folds the
  Attempt 3 bootLog lines that live in `useMeditationLibrary.ts` and
  `MeditationScreen.tsx`, since interactive staging is unavailable).
- `6a8f9bd` perf(pwa): drop mp3 from SW precache, defer music preload — Attempt 2.
- `65e134a` chore(debug): add localStorage boot log — Attempt 3 (`bootLog.ts`,
  main.tsx, LandingScreen, BreathingScreen).

Loose assets (elevenlabs_*.mp3, eule_uhl_logo.jpg, leberch-meditation-513747.mp3)
and `.planning/debug/` intentionally left untracked.

**Blocked on human-action:** user deploys to Vercel, reproduces the crash on the
iPhone, and reads back `localStorage.getItem('buho-boot-log')` from the recovery
launch via macOS Safari Web Inspector. The last log line selects the surviving
hypothesis (see the diagnostic table under "Expected diagnostic signals" /
"Once we know where it dies"). Recommended fix regardless of outcome: object-store
split (meta store + blob store) so the blob is never in the cold-start read path.

## REFINED HYPOTHESIS (2026-07-03) — read this first

Code re-review found the smoking gun the prior "lazy-blob fix" (Attempt 1)
DID NOT actually address:

`listMeditations()` in `src/lib/meditationsDB.ts` still calls
`db.getAllFromIndex(STORE, 'addedAt')`, then strips the blob in JS with
`.map(({ blob: _blob, ...meta }) => meta)`. The blob is only kept out of
React **state** — it is still **fully structured-cloned into the renderer
heap** during the `getAllFromIndex` read on EVERY cold start, then discarded.
The code comment (meditationsDB.ts lines 37-40) even admits this:
"The Blob still rides through structured clone during the read."

This is exactly H3. Attempt 1 was mis-targeted: it prevented state residency,
not read residency. On iOS Safari standalone-PWA (tight per-tab renderer
budget), an 18.7 MB Blob structured-clone spike during cold-start hydration is
the leading OOM candidate. It exactly matches "works with empty IDB, crashes
with one mp3" and "no JS exception (renderer killed by OS)."

**Fix direction (regardless of boot-log outcome):** stop reading blobs during
`listMeditations()`. Two clean options:
  - (A) Iterate the `addedAt` index with a **key cursor** / `getAllKeys` +
    per-key metadata, so the Blob field is never in the read result. Since the
    Blob lives on the same record, this needs either a projection (IDB has
    none) or a schema split.
  - (B) **Split the object store**: `meditations-meta` (id, filename,
    duration, addedAt) and `meditations-blobs` (id → blob). Cold-start reads
    only the meta store; `getMeditationBlob(id)` reads the blob store lazily.
    This is the store-split already anticipated in the decision tree below and
    is the robust fix — no multi-MB structured clone ever happens on cold
    start.

**Confirmation still requires the on-device boot log** (see below): if the log
stops between `listMeditations() called` and `resolved n=1`, H3 is confirmed
directly. But because the code proves the blob is read on cold start
regardless, option (B) is worth preparing now and is the recommended fix.

## RESUME HERE (2026-06-30)

Attempt 3 (crash-survival logging) is **instrumented but not yet deployed or
read back**. Working tree has uncommitted `bootLog` calls in main.tsx,
LandingScreen, BreathingScreen, MeditationScreen, useMeditationLibrary, plus
new `src/lib/bootLog.ts`. `tsc --noEmit` is clean. Tests not re-run since
instrumentation — the new module has no behavior changes but `npx vitest run`
should still pass; spot-check before deploying if paranoid.

### Next concrete steps

1. Commit instrumentation (suggested message: `chore(debug): add localStorage
   boot log for iOS cold-start crash`).
2. Deploy to Vercel.
3. On the iPhone: delete the PWA from home screen, re-install, add the
   18.7 MB mp3, swipe-kill the app, relaunch → crash overlay → dismiss /
   recovery reload.
4. In macOS Safari Develop → [iPhone] → attach Web Inspector to the recovery
   launch, then in the console:
   ```js
   console.log(localStorage.getItem('buho-boot-log'));
   ```
5. Match the last line against the "Expected diagnostic signals" table in
   Attempt 3 below — that tells us which hypothesis (H3 IDB open / H5 splash
   chain / H6 SW timing / H7 unknown) survives.

### Once we know where it dies, the lazy next move per signal

- **Stops before `main.tsx loaded`** → SW or splash chain. Smallest test:
  flip `registerType: 'autoUpdate'` → `'prompt'` in vite.config.ts, redeploy,
  retest. If still crashes, try `VitePWA({ disable: true })` for one build to
  isolate the SW entirely.
- **Stops at `listMeditations() called`** → H3 confirmed (iOS structured-
  clones the Blob on IDB open). Fix: split the store — metadata in one
  object store, blobs in another. Open only the metadata store on cold start;
  open the blob store lazily inside `getMeditationBlob`.
- **Reaches `resolved n=1` and full render** → crash is post-render. Suspect
  decoded image residency (logo.jpg + 192/512 PWA icons + splash). Try
  shrinking logo.jpg, retest.

Don't re-investigate H1/H2 (already eliminated under "What's been ruled out"
in the prior status update).

# Debug Session: iOS PWA cold-start crash with mp3 in IDB

## Symptoms

- **Expected**: App launches normally from iPhone home-screen icon (PWA standalone mode).
- **Actual**: Safari shows "website crashed" overlay (`webkit-internal://crash` HTML).
  Page never finishes loading. Renderer process killed by iOS.
- **Errors**: No JavaScript exception. No console output captured. Web Inspector shows
  "website crashed" entry in Develop → [iPhone] dropdown. Only `data:text/html` network
  entry is the crash-overlay page from WebKit itself.
- **Timeline**: Started after user added their first ~18.7 MB meditation mp3 via the
  Meditation panel. First session after adding works fine; crash begins after the next
  full app termination + relaunch.
- **Reproduction**:
  1. Open búho PWA from home-screen icon (works on empty IDB).
  2. Add an 18.7 MB mp3 meditation via the Meditation panel.
  3. Confirm playback works.
  4. Swipe búho fully closed (app switcher → swipe card up).
  5. Tap home-screen icon to relaunch.
  6. Crash overlay appears every time. Reproducible.

## Investigation history

- Web Inspector attached via macOS Safari Develop menu to PWA on iPhone (Web Inspector
  enabled in iOS Settings → Safari → Advanced and for Home Screen Apps).
- Storage panel initially showed empty IDB — diagnosed as scope mismatch (Safari tab vs.
  PWA scope show different storage). After re-installing the PWA fresh and re-adding
  meditation, IDB record visible in inspector.
- Confirmed blob is in IDB: `blob` field shows `size: 18682095` bytes.
- Confirmed IDB read is fast and the blob deserializes cleanly. Console probe:
  ```js
  (async () => { /* indexedDB.open + getAll buho-meditations */ })()
  ```
  returned `read 1 records in 12.0 ms, blob bytes: 18682095`.
- Re-confirmed crash repros after blob is in IDB by fully closing and relaunching the
  PWA from home-screen icon.

## Resolution (2026-07-03 — RESOLVED, verified on-device)

- **root_cause**: A single-store IndexedDB schema (v1) kept the 18.7 MB meditation
  blob on the same record as its metadata. `listMeditations()` read that store via
  `db.getAllFromIndex('meditations', 'addedAt')` on every cold start, which structured-
  cloned the entire 18.7 MB blob into the renderer heap; the JS `.map()` strip only ran
  AFTER the clone. On iOS Safari standalone-PWA the jetsam memory watchdog killed the
  renderer ~100-120ms after that allocation spike on every cold start. (On-device
  safe-boot log proved both crashed boots reached `resolved n=1` then died moments
  later; the only delta vs the healthy boot 1 was n=1 — one blob present. Attempt 1's
  lazy-blob refactor only kept the blob out of React STATE, never out of the cold-start
  READ, which is why it did not fix the crash.)
- **fix**: DB version 1 → 2, store split. `src/lib/meditationsDB.ts`:
  - `meditations-meta` store (keyPath id, index addedAt) holds { id, filename,
    duration, addedAt } only.
  - `meditations-blobs` store (keyPath id) holds { id, blob }.
  - `listMeditations()` reads ONLY the meta store → no blob ever materialized on
    cold start (the load-bearing invariant).
  - `getMeditationBlob(id)` reads the blob store lazily on play.
  - `addMeditation` writes both stores in ONE transaction (`add` on both → duplicate
    ids still reject, write is atomic). `deleteMeditation` clears both in one tx (no
    orphaned blobs).
  - **Migration choice (recorded per task_constraints step 2):** I chose the SIMPLE
    real migration — the v1→v2 upgrade handler opens a cursor over the legacy
    `meditations` store, splits each record into the two new stores, then
    `deleteObjectStore('meditations')`. KNOWN & ACCEPTED RISK: the cursor read clones
    the legacy blob once during the upgrade launch, so a memory-tight cold start could
    theoretically jetsam-kill the upgrade itself. Accepted because (a) this is a
    single-user personal app, (b) the migration is trivial, (c) if the upgrade launch
    IS killed, the user simply re-adds the mp3 on a fresh install — no integrity risk.
    Not chosen: dropping legacy records outright (would force re-import even when
    migration would have succeeded).
- **verification**:
  - Automated (after final cleanup cycle): `npx tsc --noEmit` clean; `npx vitest run`
    17 files / 160 tests passing (the 7 safe-boot instrumentation tests were removed
    with the instrumentation); `npm run build` clean (single entry bundle 256.77 kB /
    78.76 kB gzip — the debug-artifact dynamic-import chunk split is gone; precache 13
    entries / 647.95 KiB, mp3 still excluded from precache).
  - On-device (user, PASSED): reinstalled the PWA fresh, added the 18.7 MB mp3,
    swipe-killed via app switcher, relaunched multiple times — no crash overlay, no
    safe-mode screen, playback works. Then added 6 more meditations (7 total in IDB)
    and it still launches and plays fine. Root cause confirmed resolved on-device.
- **commit(s)**:
  - `44646c8` fix(meditation): split IDB into meta+blob stores so cold start never
    clones the blob (the actual fix).
  - `9841acc` chore(debug): remove boot instrumentation (deleted bootLog.ts /
    safeBoot.ts / safe-boot.test.ts and all call sites; restored main.tsx to a clean
    static App mount).
  - `51bc43c` chore(debug): harden IDB open (blocked/blocking/terminated handlers,
    reset memoized dbPromise on open failure, corrected migration-risk comment +
    no-non-IDB-awaits guard comment — from the Specialist Review).
  - NOT pushed, NOT deployed by this cycle. Loose assets left untracked.
- **files_changed**:
  - Fix (44646c8): src/lib/meditationsDB.ts, src/__tests__/meditations-db.test.ts
    (and the Attempt-1 lazy-blob supporting files landed earlier: src/types/meditation.ts,
    src/hooks/useMeditationLibrary.ts, src/components/MeditationLibrary.tsx,
    src/components/MeditationListRow.tsx, src/components/MeditationScreen.tsx,
    src/components/MeditationPlayer.tsx, plus meditation-player/meditation-screen tests).
  - Cleanup (9841acc): deleted src/lib/bootLog.ts, src/lib/safeBoot.ts,
    src/__tests__/safe-boot.test.ts; edited src/main.tsx,
    src/components/LandingScreen.tsx, src/components/BreathingScreen.tsx,
    src/components/MeditationScreen.tsx, src/hooks/useMeditationLibrary.ts.
  - Hardening (51bc43c): src/lib/meditationsDB.ts.

## Current Focus

- **status**: RESOLVED. On-device verification PASSED (user, 2026-07-03): fresh
  reinstall + 18.7 MB mp3 + swipe-kill + multiple relaunches → no crash, no safe-mode
  screen, playback works; 7 total meditations still launch and play fine. Diagnostic
  instrumentation (bootLog + safe-boot viewer) removed; IDB open hardened per the
  Specialist Review; session archived to .planning/debug/resolved/.
- **next_action**: none — session closed.
- **hypothesis (superseded)**: H3 (refined). On cold start, `useMeditationLibrary` mounts →
  `listMeditations()` → `db.getAllFromIndex(STORE, 'addedAt')` structured-clones the
  entire 18.7 MB Blob into the renderer heap, THEN strips it in JS. Attempt 1 only kept
  the blob out of React state, not out of the read. This transient multi-MB clone during
  cold-start hydration trips the iOS Safari standalone-PWA renderer memory budget → OS
  kills the process → WebKit "website crashed" overlay, no JS exception. Matches "empty
  IDB works / one mp3 crashes" and "no console error."
- **test**: On-device boot log is the direct confirmer. If `buho-boot-log` shows
  `listMeditations() called` but never `resolved n=1`, H3 is confirmed (the process dies
  inside the getAllFromIndex clone). Independent of the log, the code proves the blob is
  read on cold start.
- **expecting**: Boot log's last line is `useMeditationLibrary: listMeditations() called`
  (crash between call and resolve).
- **next_action**: CHECKPOINT (human-action) — Web Inspector readback is impossible
  (SecurityError on the opaque data: crash-overlay origin; every relaunch crashes so no
  live context exists). Safe-boot viewer (commit `4ea30fb`) now displays `buho-boot-log`
  on-screen after 2+ crashed relaunches. User deploys, reproduces the crash loop, reads
  the on-screen log, and pastes back the last line(s). If NO safe-mode screen ever
  appears after 2+ crashes → pre-JS death (H5/H6). Then apply the object-store split
  (meta store + blob store) if H3 is confirmed. NOTE: fix itself is NOT this cycle.
- **reasoning_checkpoint**:
  - hypothesis: `getAllFromIndex` structured-clones the 18.7 MB blob into the renderer on
    every cold start; that spike OOMs the iOS PWA renderer.
  - confirming_evidence: (1) meditationsDB.ts reads the full record set via
    `getAllFromIndex` and only strips blob post-read; (2) crash correlates exactly with
    presence of one large blob in IDB; (3) no JS exception → OS process kill, consistent
    with memory pressure; (4) prior probe showed the blob deserializes (18,682,095 bytes)
    — confirming it IS materialized on read.
  - falsification_test: boot log reaches `resolved n=1` and full render → crash is
    post-hydration (H5/H7), hypothesis wrong.
  - fix_rationale: object-store split removes the blob from the cold-start read path
    entirely — addresses the root cause (read residency), not just state residency.
  - blind_spots: haven't confirmed on-device WHERE it dies; iOS may also OOM on splash
    image decode (H5) or SW re-precache (H6) independent of the blob read.

## Evidence

- timestamp: 2026-06-29 — IDB record present, blob size 18,682,095 bytes, deserializes
  in 12 ms in console probe. Cold start repros crash reliably.
- timestamp: 2026-06-29 — No JS exception in Web Inspector console pre-crash. No
  failed network requests besides WebKit's crash-overlay `data:text/html`. Suggests
  renderer process termination by iOS (memory pressure), not a thrown error.
- timestamp: 2026-07-03 — Code re-review of `src/lib/meditationsDB.ts`:
  `listMeditations()` still calls `db.getAllFromIndex(STORE, 'addedAt')` and strips the
  blob in JS AFTER the read (`.map(({ blob: _blob, ...meta }) => meta)`). The blob is
  therefore fully structured-cloned into the renderer heap on every cold start, then
  discarded. Implication: Attempt 1 ("lazy-blob") only removed blob from React STATE, not
  from the cold-start READ. H3 was never actually addressed. This is the leading OOM
  candidate and the boot log should confirm it (crash between `listMeditations() called`
  and `resolved n=1`).
- timestamp: 2026-07-03 — Instrumentation verified present in working tree: `bootLog`
  calls in main.tsx (loaded / render returned), BreathingScreen (module eval + render),
  MeditationScreen (module eval + render), useMeditationLibrary (called / resolved /
  rejected). LandingScreen not yet re-read but per Attempt 3 notes it is instrumented.
  vite.config.ts still `registerType: 'autoUpdate'`, mp3 excluded from precache
  (globPatterns), runtime CacheFirst for mp3. Not yet deployed/read-back on device.

- timestamp: 2026-07-03 — ON-DEVICE SAFE-BOOT LOG READBACK (H3 confirmed). Full log:
  boot 1 (fresh install) resolved n=0, ~13s healthy session incl. playback. boot 2
  (cold relaunch): all three screens render() entered, `listMeditations() called`,
  `resolved n=1`, then main.tsx re-loads only 239ms later (WebKit auto-reload after a
  renderer kill). boot 3: `called` → `resolved n=1` → dies ~100ms later. boot 4:
  safe-mode screen (crash count 2). Implication: both crashed boots complete the IDB
  read and die ~100-120ms AFTER `resolved n=1`; the sole delta vs the healthy boot is
  n=1 (blob present). This is H3 in its DELAYED-kill form — `getAllFromIndex`
  structured-clones the 18.7 MB blob (strip happens post-clone) and iOS jetsam kills
  the renderer asynchronously moments after the spike, which is why `resolved` logs
  before death. Confirms the root cause and directly eliminates H5/H6 as the kill
  trigger (JS ran through the full read on every crash).

## Eliminated

- hypothesis: H5 (splash-screen / logo.jpg / PWA icon decode is the kill trigger) —
  evidence: on-device safe-boot log (2026-07-03) shows both crashed boots run JS all
  the way through module eval, all three screens' render() entry, AND the IDB read
  (`resolved n=1`) before dying. The renderer is demonstrably alive well past the
  pre-JS splash/icon phase, so splash-image decode is not what kills it. Images are
  identical across the healthy boot 1 and the crashing boots. timestamp: 2026-07-03.
- hypothesis: H6 (service-worker registration/re-precache timing is the kill trigger) —
  evidence: same boot log — JS executes through the full render + IDB read on every
  crashed boot, and the safe-boot viewer itself appeared (crash count 2), proving JS
  runs. SW activation is identical across healthy and crashing boots. The PRE-JS-DEATH
  caveat (no safe-mode screen after 2+ crashes) did NOT fire. timestamp: 2026-07-03.
- hypothesis: Service-worker precache failure causing reload loop — Network panel
  doesn't show failed precache fetches before the crash; WebKit overlay is shown,
  not a normal Safari reload loop.
- hypothesis: Corrupt IDB record / read failure — `getAll` succeeds with valid blob in
  12 ms inside the console probe.
- hypothesis: pure JavaScript exception during init — no error visible in console
  before the page dies.

## Files in scope

- src/types/meditation.ts
- src/lib/meditationsDB.ts
- src/hooks/useMeditationLibrary.ts
- src/hooks/useMeditationPlayer.ts
- src/components/MeditationScreen.tsx
- src/components/MeditationPlayer.tsx

## STATUS UPDATE 2026-06-29 (still crashing)

Both attempted fixes are applied and committed to working tree — and the PWA
still crashes on cold start after adding the 18.7 MB meditation, swiping fully
closed, and relaunching from the home-screen icon. Tested via cloudflared
tunnel → `vite preview` of the production build. PWA was fully deleted from
home screen and re-installed between each test, so the new SW was active.

### What's been ruled out

1. **IDB blob residency on cold start (Attempt 1)** — `listMeditations()` no
   longer returns the blob; `useMeditationLibrary` state holds metadata only.
   Verified by tests. **Crash persisted.**
2. **SW precaching all mp3s + eager music preload (Attempt 2)** — removed `mp3`
   from `vite.config.ts` workbox `globPatterns`; added runtime CacheFirst rule
   for mp3; flipped `useBreathingAudio` music Howl to `preload: false`.
   Precache went from **6,613 KiB → 647 KiB**. **Crash persisted.**

### What still happens

- Working session after install: OK. Add meditation, play it, all fine.
- Hard kill (swipe app off app switcher) → relaunch from home-screen icon
  → WebKit "website crashed" overlay (`data:text/html` from webkit-internal).
- No JS exception in Web Inspector pre-crash (console empty).
- cloudflared logs show requests for `/sw.js`, `/logo.jpg`, and
  `/audio/meditation.mp3` being canceled mid-flight as the renderer dies.

### New / remaining hypotheses

The crash is reproducible cold-start; an active session is fine. So something
runs on launch that isn't memory-bounded the way we'd expect.

- **H3 — IDB open itself is the trigger.** `getDb()` runs on the first
  `listMeditations()` call. Even though `getAll` is fast in our probe (12 ms),
  iOS Safari has historically had bugs where opening an IDB containing a
  large blob structured-clones the blob eagerly into the cursor cache.
  Could test by adding `console.time` around the `openDB` call and the
  `getAllFromIndex` call separately, and checking what fires before the crash.
  But the inspector dies with the page, so we'd need to log to localStorage
  and read it back.
- **H4 — Workbox runtime cache hydration on launch.** Even with mp3 out of
  precache, the new CacheFirst rule registers the route on SW activation,
  and the existing `buho-audio` runtime cache (if persisted from prior runs)
  might be deserialized eagerly. Less likely but worth checking.
- **H5 — Splash-screen / `apple-touch-icon.png` chain.** iOS PWA cold-start
  shows the splash screen first; if WebKit pre-decodes the logo.jpg
  (it was in the canceled-request list) plus the 192/512 PWA icons + the
  PWA chrome, on a memory-constrained device that alone can trip the kill.
  Long shot.
- **H6 — Service-worker registration timing.** `registerType: 'autoUpdate'`
  triggers an update check on every load. If the SW update finds a new
  precache manifest, it re-precaches before activating. On iOS in PWA mode
  this might run synchronously with the page load. Could test by switching
  to `registerType: 'prompt'` or even by temporarily disabling the SW entirely
  (`{ devOptions: { enabled: false }, disable: true }` via env flag) to see
  if the crash goes away.
- **H7 — Something we haven't found yet about the launch path.** Worth
  systematically logging at top of `main.tsx`, each panel mount, and each
  `useEffect` first line, writing to localStorage so it survives the crash.

### Recommended next actions

1. **Add crash-survival logging.** Log to `localStorage` with a counter at
   each lifecycle waypoint, read after relaunch. The empty Web Inspector
   console doesn't tell us WHERE in the load it dies — we have to find out.
   ```ts
   // main.tsx, top:
   const log = (m: string) => {
     try { localStorage.setItem('buho-boot-log',
       (localStorage.getItem('buho-boot-log') || '') + Date.now() + ' ' + m + '\n');
     } catch {}
   };
   log('main.tsx loaded');
   ```
   Then read `localStorage.getItem('buho-boot-log')` in Web Inspector on the
   recovery launch (the one Safari shows after the crash overlay) to see
   how far it got.
2. **Disable SW for a single test** to isolate. If a no-SW cold start works,
   it's the SW. If it still crashes without the SW, it's something in our
   React tree.
3. **Test without the meditation in IDB** but with a fresh install. We've
   confirmed empty IDB launches work — the question is whether adding the
   meditation + relaunching crashes even on a brand-new install (could be a
   regression unrelated to IDB residency, e.g. localStorage corruption).

## Attempts so far (2026-06-29) — bug NOT resolved by these

- **root_cause**: `listMeditations()` in `src/lib/meditationsDB.ts` returned the full
  `MeditationRecord[]` from IDB including the multi-MB `blob` field. The
  `useMeditationLibrary` hook stored that array (with the blob) in React state on
  every mount of `MeditationScreen`, which mounts on cold start because all three
  panels live in the same `SwipeContainer`. On iOS Safari standalone-mode PWA, the
  resulting blob residency in the renderer combined with service-worker activation
  pressure exceeded the per-tab memory budget; the OS killed the process before JS
  reached first paint, producing WebKit's `data:text/html` "website crashed" overlay
  with no JS exception.
- **fix**: Lazy-blob refactor.
  - `src/types/meditation.ts` — added `MeditationMeta = Omit<MeditationRecord, 'blob'>`.
  - `src/lib/meditationsDB.ts` — `listMeditations()` now returns `MeditationMeta[]`
    (blob stripped in JS after read; IDB has no field projection). Added
    `getMeditationBlob(id): Promise<Blob>` which fetches a single record's blob
    on demand.
  - `src/hooks/useMeditationLibrary.ts` — state holds `MeditationMeta[]`; add()
    writes the full record to IDB but only pushes meta into state.
  - `src/components/MeditationLibrary.tsx`, `src/components/MeditationListRow.tsx`,
    `src/components/MeditationScreen.tsx` — typed against `MeditationMeta`.
  - `src/components/MeditationPlayer.tsx` — accepts `meta` prop, fetches blob via
    `getMeditationBlob(id)` on mount, constructs the record locally for the player
    hook, falls back to `onBack()` if the blob is gone.
  - Tests updated: `meditations-db.test.ts` round-trip now asserts blob is stripped
    on list but retrievable via `getMeditationBlob`; `meditation-player.test.tsx`
    mocks `getMeditationBlob` and flushes the async load; `meditation-screen.test.tsx`
    mock player accepts `meta` prop.
- **verification**:
  - `npx tsc --noEmit` — clean.
  - `npx vitest run` — 17 files, 156 tests, all passing.
  - `npm run build` — production bundle builds (255.97 kB JS / 22.27 kB CSS).
  - On-device verification: deploy to Vercel, fully kill the PWA after adding
    the 18.7 MB meditation, relaunch from home-screen icon — should no longer
    crash. The blob never enters React state on cold start.
- **files_changed**:
  - src/types/meditation.ts
  - src/lib/meditationsDB.ts
  - src/hooks/useMeditationLibrary.ts
  - src/components/MeditationLibrary.tsx
  - src/components/MeditationListRow.tsx
  - src/components/MeditationScreen.tsx
  - src/components/MeditationPlayer.tsx
  - src/__tests__/meditations-db.test.ts
  - src/__tests__/meditation-player.test.tsx
  - src/__tests__/meditation-screen.test.tsx

## Attempt 3 — crash-survival logging (2026-06-29)

Not a fix — diagnostic. Web Inspector console is empty pre-crash because the
renderer dies before any logs surface. Adding localStorage breadcrumbs at
each cold-start waypoint so the recovery launch can read back where we got.

- New: `src/lib/bootLog.ts` — `bootLog(msg)` appends `${ts} ${msg}\n` to
  `localStorage['buho-boot-log']`. Try/catch around localStorage; never throws.
- Instrumented:
  - `src/main.tsx` — `main.tsx loaded`, `render() returned`.
  - `src/components/LandingScreen.tsx` — module eval + render entered.
  - `src/components/BreathingScreen.tsx` — module eval + render entered.
  - `src/components/MeditationScreen.tsx` — module eval + render entered.
  - `src/hooks/useMeditationLibrary.ts` — `listMeditations() called` /
    `resolved n=…` / `rejected …`.

### How to read it back

1. Deploy. Reproduce the crash (add 18.7 MB mp3, swipe-kill, relaunch).
2. The crash overlay appears; tap to dismiss / Safari reloads → recovery launch.
3. In Web Inspector console on the recovery launch (storage is shared across
   the kill):
   ```js
   console.log(localStorage.getItem('buho-boot-log'));
   ```
4. The last line tells us how far the cold start got.

### Expected diagnostic signals

- Log stops at `main.tsx loaded` → renderer dies before React mounts; likely
  SW activation or splash-screen image decode (H5/H6).
- Log stops at `MeditationScreen render() entered` but never
  `useMeditationLibrary: listMeditations() called` → tree mount itself blew
  memory budget; component-level (H5/H7).
- Log shows `listMeditations() called` but never `resolved` → IDB open is the
  trigger (H3 confirmed — iOS structured-clones the Blob into cursor on open).
- Log shows `resolved n=1` and full render chain → crash is post-render
  (paint, animation frame, or asset decode).

Remove `bootLog` calls once a fix lands and a regression test guards it.

## Specialist Review (2026-07-03, ios — fix commit 44646c8)

**Verdict: LOOKS_GOOD** — store split is the correct, idiomatic WebKit fix
(metadata reads must never share a record with multi-MB payloads); idb usage
inside the versionchange transaction is safe; add/delete atomicity handled.

Findings / recommended hardening (non-blocking):
- Migration failure semantics better than the code comment claims: the
  versionchange tx is atomic — a jetsam kill mid-upgrade rolls back to intact
  v1 (no data loss). Real risk is a retry crash-loop, not re-import. Correct
  the comment at src/lib/meditationsDB.ts:52-61. Mitigating: cursor reads one
  record at a time and WebKit deserializes IDB Blobs as file-backed handles,
  so migration peak allocation is well below the v1 getAllFromIndex spike.
- Upgrade tx lifetime is correct (all awaits are IDB-request-backed). Add a
  one-line guard comment: no non-IDB awaits (fetch/timers) in that block.
- Missing blocked/blocking/terminated handlers on openDB: a stale v1
  connection (zombie iOS PWA instance) would hang the v2 open silently —
  library renders empty, no error. Pass blocking: () => db.close() and log
  blocked. Cheap insurance on iOS.
- getMeditationBlob single-record get acceptable: one blob clone on
  user-gesture play is in-session (larger jetsam budget); WebKit returns a
  file-backed Blob handle, so object-URL playback streams from disk.
- Minor: rejected openDB stays memoized in dbPromise forever — reset to null
  in .catch (two-line hardening). DBSchema typing would drop `as` casts
  (cosmetic).
