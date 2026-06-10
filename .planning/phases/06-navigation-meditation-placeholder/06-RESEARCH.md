# Phase 6: Navigation & Meditation Placeholder - Research

**Researched:** 2026-06-10
**Domain:** Browser-side audio file management (IndexedDB Blob storage + Howler playback) on iOS PWA
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Panel Structure**
- **D-01:** Keep 3 swipeable panels: Landing (panel 0) → Breathing (panel 1) → Meditation (panel 2). No panels added or removed.
- **D-02:** Initial/default panel on app launch: **Landing (panel 0)** — current behavior preserved. No "remember last panel" persistence.
- **D-03:** ROADMAP.md success criteria for Phase 6 is reworded from "two-mode" to "modes + Landing" to match implemented reality. Doc update, not a code change.

**Meditation Library — Import**
- **D-04:** Import via native iOS file picker (`<input type="file" accept="audio/*">`). Single-select for v1.
- **D-05:** No URL fetch, no drag-drop, no bundled meditations. The user provides all content.

**Meditation Library — Storage**
- **D-06:** Audio binaries stored as **Blobs in IndexedDB** (not localStorage — file sizes are MB-scale).
- **D-07:** Each meditation record stores: `id`, `filename` (used as title), `duration` (seconds, auto-extracted on import), `blob`, `addedAt` (timestamp).
- **D-08:** No user-editable title. No tags. No description. Filename is the title.

**Meditation Library — UI**
- **D-09:** Empty state: centered message + a single "Add meditation" button.
- **D-10:** Populated state: simple list of meditations (filename + duration), tap a row to play. "Add meditation" button stays visible.
- **D-11:** Each list row supports **delete** — researcher to compare swipe-to-delete vs. trash icon, planner locks the choice.
- **D-12:** Same dark sage minimal aesthetic as breathing screen (`#5f7d60` background, ivory text/accents). Phase 1 design tokens.

**Meditation Player**
- **D-13:** Minimal player UI — large centered play/pause control, meditation title above, elapsed/total time below. No seek bar. No skip buttons.
- **D-14:** Tap the play/pause control to toggle. A "back" / "stop" affordance returns to the library.
- **D-15:** Auto-stop on natural end: when audio finishes, the player closes and returns to the library view automatically.
- **D-16:** Wake lock acquired on play, released on pause/stop/end (mirrors breathing session — reuse `useWakeLock` hook).

**Audio Infrastructure**
- **D-17:** **Reuse Howler.js** (already a project dependency). One Howl instance per playing meditation.
- **D-18:** Meditation playback is independent of breathing audio (`useBreathingAudio`). The two are not used simultaneously — entering Meditation panel does not stop breathing audio if a session is running, but starting meditation playback while a breathing session runs is an edge case the planner should address.

**Gesture Handling**
- **D-19:** Trust native scroll-snap behavior in `SwipeContainer`. No new gesture lock during breathing sessions.

### Claude's Discretion

- Exact list-row layout (filename truncation rules, font sizes, divider styles).
- Swipe-to-delete vs. trash icon — researcher proposes, planner picks.
- "Add meditation" button placement (top, bottom, FAB).
- Visual treatment of the active/playing row.
- Time-format display (`12:34` vs `12 min`).
- `id` generation (uuid vs timestamp vs incrementing).

### Deferred Ideas (OUT OF SCOPE)

- Multi-file import (single-file picker for v1)
- User-editable titles, tags, descriptions
- Seek bar / scrub control in player
- Skip-back / skip-forward buttons (15s)
- Visual ambient animation during meditation playback
- Storage quota warnings / used-space display
- URL fetch / paste-a-link import
- Bundled starter meditations
- Last-visited panel persistence
- Gesture lock during active breathing session

### Required Roadmap / Requirements Updates (Wave 1 doc tasks)

- ROADMAP.md Phase 6 success criteria — rewrite to 9-point list (see CONTEXT.md "Required Roadmap / Requirements Updates")
- REQUIREMENTS.md — replace MEDT-01/MEDT-02 with new MEDT-* requirements (upload, persist, library list, player UI, delete, wake lock)
- Coverage table re-mapped to Phase 6
</user_constraints>

<phase_requirements>
## Phase Requirements

### Existing IDs (to be revised in Wave 1)

| ID | Description | Research Support |
|----|-------------|------------------|
| NAV-01 | User can swipe between breathing mode and meditation mode | Already implemented in Phase 1 (`SwipeContainer.tsx` + native scroll-snap). Phase 6 verifies the 3-panel structure still holds end-to-end. |
| NAV-02 | Page indicator shows which mode is active | Already implemented (`PageDots.tsx` with `total=3`/`active`). No changes expected unless a panel is added. |
| MEDT-01 (obsolete) | Meditation mode shows placeholder screen | **Replaced** by new MEDT requirements covering library + player. |
| MEDT-02 (obsolete) | Meditation mode uses consistent dark design | **Folded into** the new MEDT-* requirements (still required, but no longer the entire scope). |

### Proposed New Requirements (Wave 1 will write these into REQUIREMENTS.md)

The planner should replace the two obsolete MEDT requirements with the following set. IDs are suggestions — the planner's Wave 1 doc task will finalize them.

| ID | Description | Research Support |
|----|-------------|------------------|
| MEDT-01 | User can upload an audio file from the iOS file picker | Section: iOS file picker UX. `<input type="file" accept="audio/*">` opens the iOS Files sheet (Files / iCloud Drive). |
| MEDT-02 | Uploaded meditations persist locally (IndexedDB) across app restarts | Section: IndexedDB wrapper choice. `idb` v8.0.3, single object store, Blob payloads. |
| MEDT-03 | User can browse a library of uploaded meditations | Section: Reducer-vs-state. `useState` for view + selection. |
| MEDT-04 | User can tap a meditation to start playback | Section: Blob URL lifecycle for Howler. `URL.createObjectURL(blob)` + `format: [...]` hint. |
| MEDT-05 | Player shows title + elapsed/total time and supports play/pause/stop | Section: Code Examples (`useMeditationPlayer`). Howler `seek()` polled via `requestAnimationFrame` or `setInterval`. |
| MEDT-06 | Screen does not lock during meditation playback | Section: Wake lock coordination. Reuse `useWakeLock` (`activate`/`release`). |
| MEDT-07 | User can delete a meditation from the library | Section: Swipe-to-delete vs trash-icon. Recommendation: **trash icon** for v1. |
| MEDT-08 | Meditation panel matches the dark sage aesthetic | Section: Standard Stack. Tailwind utility classes mirroring BreathingScreen. |

The plan-checker should verify every new MEDT-* ID maps to at least one task and that the obsolete IDs are removed from the traceability table.
</phase_requirements>

## Summary

Phase 6's scope is overwhelmingly the **meditation library + player**, not navigation. Navigation work is verifying that the existing 3-panel scroll-snap shell still holds end-to-end and rewording legacy "two-mode" copy.

For the meditation library, every key technical choice has a clear, low-risk answer with existing tooling already in the project:

- **Storage:** `idb` v8.0.3 (Jake Archibald) — 12KB minified, ~5KB gzipped, mirrors the IndexedDB API with promises. Far smaller than Dexie (3.2MB unpacked) and richer than `idb-keyval` for our slightly-structured single-store schema.
- **Audio playback:** Reuse Howler.js (already installed) with `URL.createObjectURL(blob)` as `src`. Must pass `format: ['mp3'|'mp4'|...]` because Blob URLs have no extension. Use `html5: true` for files this size. Revoke the object URL inside the Howl's `onunload` callback or after `unload()` returns to avoid leaks.
- **Duration extraction:** `<audio>` + `loadedmetadata`. Handle the `Infinity`/`NaN` edge case by seeking to `Number.MAX_SAFE_INTEGER` and listening for `durationchange`. Most user-uploaded m4a/mp3/wav files report duration immediately; the seek-to-end fallback covers WebM and broken files.
- **File picker:** `<input type="file" accept="audio/*">` works on iOS Safari and presents the iOS Files sheet (Files / iCloud Drive / On My iPhone). Single-select for v1 (no `multiple` attribute).
- **Delete UX:** Recommend **visible trash icon on each row** — discoverable, accessible, no hidden gesture, no extra dependency. Swipe-to-delete is iOS-native but discoverability is poor for a small power-user audience and would require ~50 LOC of pointer-event plumbing or a 50KB+ dependency.
- **Wake lock:** Reuse `useWakeLock` as-is. One known footgun: `activate()` overwrites `sentinelRef.current` without releasing the previous sentinel, so simultaneous breathing-session + meditation-player would leak one sentinel. Address per D-18: meditation player either checks/short-circuits, or trusts the user to stop breathing first.
- **State shape:** A `useState`-based shape (`view: 'library' | 'playing'`, `selected: id | null`, plus the meditation array) is simpler and clearer than a reducer here. Reducer is warranted for breathing because of the multi-action timing-config flow; meditation has 4-5 transitions total.

**Primary recommendation:** Add `idb` as the only new dependency, build a thin `src/lib/meditationsDB.ts` module (open + list/add/delete), wrap it in a `useMeditationLibrary` hook, write a `useMeditationPlayer` hook that mirrors `useBreathingAudio`'s Howler patterns, and rebuild `MeditationScreen.tsx` as the orchestration container. Ship a **trash icon** delete UX. Total new code is small; total new bundle weight is ~5KB gzipped.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Panel scroll/snap navigation | Browser / Client (DOM CSS) | — | Native CSS `snap-x` already handles this; no JS gesture layer. |
| Page indicator dots | Browser / Client (React) | — | Pure presentational; receives `active` from `App.tsx`. |
| File picker invocation | Browser / Client (DOM) | — | `<input type="file">` is a UA-controlled UI element. |
| Audio metadata extraction (duration) | Browser / Client (HTMLMediaElement) | — | `<audio>` element + `loadedmetadata` event. No server. |
| Persistent storage (Blobs + metadata) | Database / Storage (IndexedDB) | Browser / Client (idb wrapper) | IndexedDB is the only client-side store that handles MB-scale Blobs. Wrapper is just ergonomics. |
| Library list state | Browser / Client (React hook) | Database / Storage (IDB) | React hook hydrates from IDB on mount; mutations write through. |
| Audio playback | Browser / Client (Howler over HTML5 Audio) | — | iOS Safari requires HTML5 audio path for large files; Web Audio path is XHR-based and worse for Blob URLs. |
| Wake lock | Browser / Client (Screen Wake Lock API) | — | Existing hook handles platform fallback. |
| File picker → metadata → store pipeline | Browser / Client (orchestration) | Database / Storage (final write) | A single async function owns the multi-step flow; planner should keep it in one module to avoid scattering Blob/URL ownership. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `idb` | 8.0.3 | Promise-based wrapper around the IndexedDB API | [VERIFIED: npm view idb] Smallest competent wrapper (~12KB min, ~5KB gz, 13 files in tarball, 16.4KB tarball, 82.8KB unpacked). Authored by Jake Archibald (Google Chrome / web standards). [CITED: https://github.com/jakearchibald/idb] |
| `howler` | 2.2.4 | Audio playback abstraction | Already in project (Phase 3). Handles iOS Safari unlock + HTML5 fallback. [VERIFIED: package.json] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `crypto.randomUUID()` | n/a | Stable id for meditation records | [CITED: MDN] Available in iOS Safari 15.4+. No dependency needed. |
| Native `URL.createObjectURL()` / `URL.revokeObjectURL()` | n/a | Convert IDB Blob → playable src for Howler | Browser-native, zero deps. |
| Native `<input type="file">` | n/a | iOS file picker | Browser-native, opens iOS Files / iCloud Drive sheet. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `idb` (8.0.3) | `idb-keyval` (6.2.5) | [VERIFIED: npm view idb-keyval] Smaller (~4KB min) but pure key-value — fine for blobs but loses ergonomic `getAll()` / index iteration. Schema is single-store enough that we *could* use it. **Recommendation: still use `idb`** because we want `getAll()` ordered by `addedAt` and the size delta (~1KB gz) is negligible. |
| `idb` | Dexie (4.4.3) | [VERIFIED: npm view dexie dist.unpackedSize=3234335] 40x larger unpacked. ORM-style with hooks/observables we don't need. Overkill for one object store. |
| `idb` | Vanilla `indexedDB` | Free (zero deps) but ~80 LOC of callback-style boilerplate per CRUD operation. Worth saving the dev time. |
| `crypto.randomUUID()` | `nanoid` 5.1.11 | nanoid is ~150 bytes gzipped but is still a dep. `randomUUID()` is native on all targeted iOS versions. |
| Custom swipe-to-delete | `framer-motion` | [VERIFIED: CLAUDE.md "Avoid: Framer Motion"] Project already says no. ~50KB+ gz. |
| Custom swipe-to-delete | `react-swipeable` | Light (~3KB) but project chose native scroll-snap over `react-swipeable` for the panel-level swipe; consistency argues against it. Trash-icon avoids the whole question. |

**Installation:**
```bash
npm install idb
```

**Version verification (executed during research):**
- `npm view idb version` → `8.0.3` (published 2025-05-07) [VERIFIED]
- `npm view idb-keyval version` → `6.2.5` (published 2026-06-02) [VERIFIED]
- `npm view dexie version` → `4.4.3` (published 2026-05-27) [VERIFIED]
- `npm view howler version` → `2.2.4` (matches `package.json` `^2.2.4`) [VERIFIED]

## Architecture Patterns

### System Architecture Diagram

```
                          App.tsx
                            │
                            ▼
                   SwipeContainer (3 panels, native scroll-snap)
                    │            │            │
                    ▼            ▼            ▼
              LandingScreen  BreathingScreen  MeditationScreen ◀── Phase 6 work
                                                    │
                          ┌─────────────────────────┴─────────────────────┐
                          │                                                │
                          ▼                                                ▼
                useMeditationLibrary                            useMeditationPlayer
                          │                                                │
                          ▼                                                ▼
                meditationsDB (idb)                              Howler (existing dep)
                          │                                       │           │
                          │                                       ▼           ▼
                          │                                 useWakeLock  HTMLAudio
                          ▼                                       │
                   IndexedDB ('buho-meditations')                 │
                          ▲                                       │
                          │                                       │
                File picker ──► extract duration ──► add ─────────┘
                  (<input>)     (<audio> +              │
                                 loadedmetadata)        │
                                                        ▼
                                              URL.createObjectURL(blob)
                                                        │
                                                        ▼
                                                 new Howl({src, format})
                                                        │
                                                        ▼ (on unload)
                                              URL.revokeObjectURL
```

**Data flow (primary use case — play a stored meditation):**
1. User swipes to Meditation panel → `MeditationScreen` mounts.
2. `useMeditationLibrary` opens IDB and calls `getAll('meditations')` → React state holds the list.
3. User taps a row → state transitions `view: 'library'` → `view: 'playing'` with `selected: id`.
4. `useMeditationPlayer` reads the record's `blob`, calls `URL.createObjectURL(blob)`, instantiates `new Howl({ src: [objectUrl], format: [extFromFilename(filename)], html5: true })`.
5. Howler `play()` triggers; `useWakeLock.activate()` runs in the same gesture.
6. UI polls `howl.seek()` every 250ms via `setInterval` to update elapsed time.
7. Howler `onend` → state transitions back to `view: 'library'`, `useWakeLock.release()`, `howl.unload()`, `URL.revokeObjectURL()`.

### Recommended Project Structure

```
src/
├── components/
│   ├── MeditationScreen.tsx       # orchestration container (rewrite)
│   ├── MeditationLibrary.tsx      # NEW: list view (empty + populated)
│   ├── MeditationPlayer.tsx       # NEW: minimal player UI
│   └── MeditationRow.tsx          # NEW: single list row (filename, duration, delete)
├── hooks/
│   ├── useMeditationLibrary.ts    # NEW: list + add + delete CRUD wrapping IDB
│   └── useMeditationPlayer.ts     # NEW: Howler wrapper + wake lock + elapsed time
├── lib/
│   └── meditationsDB.ts           # NEW: thin idb wrapper (open + 4 ops)
├── types/
│   └── meditation.ts              # NEW: Meditation record type
└── ...existing files unchanged
```

### Pattern 1: idb DB module (single object store)

**What:** A small module that owns the IDB instance and exposes typed CRUD ops.
**When to use:** Always, for the meditation store.
**Example:**
```typescript
// Source: https://github.com/jakearchibald/idb (README article-store pattern)
// src/lib/meditationsDB.ts
import { openDB, type IDBPDatabase } from 'idb';
import type { MeditationRecord } from '../types/meditation';

const DB_NAME = 'buho-meditations';
const DB_VERSION = 1;
const STORE = 'meditations';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('addedAt', 'addedAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function listMeditations(): Promise<MeditationRecord[]> {
  const db = await getDb();
  // Index iteration is ascending by spec; reverse to deliver newest-first to the UI
  // (sort order RESOLVED in Open Questions Q3: descending by addedAt).
  const records = await db.getAllFromIndex(STORE, 'addedAt');
  return records.reverse();
}

export async function addMeditation(record: MeditationRecord): Promise<void> {
  const db = await getDb();
  await db.add(STORE, record);
}

export async function deleteMeditation(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function getMeditation(id: string): Promise<MeditationRecord | undefined> {
  const db = await getDb();
  return db.get(STORE, id);
}
```

### Pattern 2: Audio duration extraction with Infinity/NaN fallback

**What:** Extract duration from a user-uploaded `File` reliably.
**When to use:** Inside the import flow before writing to IDB (so the row can show duration without re-loading the audio).
**Example:**
```typescript
// Source: MDN HTMLMediaElement.duration + standard Infinity-fallback pattern
// (https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/duration)
export function extractDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const url = URL.createObjectURL(file);
    audio.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration)) {
        cleanup();
        resolve(audio.duration);
        return;
      }
      // Infinity/NaN fallback (WebM / MediaRecorder output / oddballs)
      audio.currentTime = Number.MAX_SAFE_INTEGER;
      audio.addEventListener('durationchange', function onDC() {
        if (Number.isFinite(audio.duration)) {
          audio.removeEventListener('durationchange', onDC);
          cleanup();
          resolve(audio.duration);
        }
      });
    }, { once: true });

    audio.addEventListener('error', () => {
      cleanup();
      reject(new Error('Could not read audio metadata'));
    }, { once: true });
  });
}
```

### Pattern 3: Howler with Blob URL — full lifecycle

**What:** Play an IDB-stored Blob through Howler without leaking object URLs.
**When to use:** In `useMeditationPlayer`.
**Example:**
```typescript
// Source: Howler.js README (Core options src/format/html5) + MDN URL.createObjectURL
import { Howl } from 'howler';

function getFormatFromFilename(filename: string): string {
  // Map common extensions to Howler-recognized format strings.
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  // Howler accepts: mp3, mpeg, opus, ogg, oga, wav, aac, caf, m4a, m4b, mp4, weba, webm, dolby, flac
  if (ext === 'm4a' || ext === 'mp4' || ext === 'm4b') return 'mp4';
  if (ext === 'mp3' || ext === 'mpeg') return 'mp3';
  if (ext === 'wav') return 'wav';
  if (ext === 'aac') return 'aac';
  if (ext === 'ogg' || ext === 'oga') return 'ogg';
  if (ext === 'webm' || ext === 'weba') return 'webm';
  if (ext === 'flac') return 'flac';
  return 'mp3'; // safe default
}

function playBlob(blob: Blob, filename: string): { howl: Howl; release: () => void } {
  const url = URL.createObjectURL(blob);
  const howl = new Howl({
    src: [url],
    format: [getFormatFromFilename(filename)], // REQUIRED: Blob URLs have no extension
    html5: true,                                // REQUIRED: large files, avoids decode-everything
    preload: true,
    onloaderror: (_id, err) => console.warn('Howl load error', err),
    onplayerror: (_id, err) => console.warn('Howl play error', err),
  });

  const release = () => {
    howl.stop();
    howl.unload();              // stops + removes from cache, frees decoded data
    URL.revokeObjectURL(url);   // release the object URL
  };

  return { howl, release };
}
```

**Lifecycle invariant:** `URL.revokeObjectURL` MUST be called AFTER `howl.unload()` (or after `howl` has emitted `loaderror` and we know it's done). Revoking before Howler finishes loading the asset will cause `loaderror`. The simplest guarantee is to revoke inside the `release()` function only after `unload()`.

### Pattern 4: Player elapsed-time updates

**What:** Update displayed elapsed time without re-rendering on every animation frame.
**When to use:** In `useMeditationPlayer`.
**Example:**
```typescript
// 250ms interval is enough resolution for "12:34" display; matches what most podcast players do.
useEffect(() => {
  if (!isPlaying || !howlRef.current) return;
  const id = window.setInterval(() => {
    const seek = howlRef.current?.seek();
    if (typeof seek === 'number') setElapsed(seek);
  }, 250);
  return () => window.clearInterval(id);
}, [isPlaying]);
```

### Pattern 5: Hidden file input + button trigger

**What:** A clean React pattern to open the iOS file picker.
**Example:**
```typescript
function AddMeditationButton({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.wav,.aiff,.flac"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          // reset so picking the same file twice fires onChange both times
          e.target.value = '';
        }}
      />
      <button onClick={() => inputRef.current?.click()}>Add meditation</button>
    </>
  );
}
```

### Anti-Patterns to Avoid

- **Storing Blobs in localStorage** — fails at MB scale; localStorage is string-only, ~5MB cap.
- **Passing the IDB-stored Blob directly into `new Howl({ src: [blob] })`** — `src` accepts URLs/data URIs, not Blob objects. Always `createObjectURL()` first.
- **Forgetting `format: [...]`** — Howler infers from URL extension; Blob URLs have none, so playback silently fails on iOS without the explicit format hint.
- **Revoking the object URL before `howl.unload()`** — kills the asset mid-load, `onloaderror` fires.
- **Using Web Audio mode (`html5: false`) for user-uploaded files** — Howler issues an XHR against the Blob URL and decodes the entire file before playback; this stalls and uses excessive memory for long meditations. `html5: true` is required.
- **Reading `audio.duration` immediately after setting `src`** — returns `NaN` until `loadedmetadata` fires.
- **Treating `Infinity` as a corrupt-file error** — many WebM and `MediaRecorder`-produced files require the seek-to-end trick.
- **Concurrent wake-lock activations** — `useWakeLock.activate()` overwrites `sentinelRef` without releasing the prior sentinel; this is a leak the planner should be aware of, even if D-18 says we trust the user.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB request → Promise plumbing | Custom callback-to-Promise wrapper | `idb` v8.0.3 | 10+ edge cases (versionchange, blocked, transaction lifecycle) handled correctly. |
| Audio file decoding / playback | Direct Web Audio API code | Howler.js (already installed) | iOS audio unlock, HTML5 fallback, format-detection edge cases. |
| Wake lock with iOS visibility re-acquisition | Custom Page Visibility listener | `useWakeLock` (already exists) | Re-acquires sentinel on `visibilitychange`; cleanup on unmount handled. |
| UUID generation | Math.random-based id | `crypto.randomUUID()` | Native, collision-free, supported on all target iOS versions. |
| Audio format MIME-type → Howler format mapping | Manual MIME parsing | `getFormatFromFilename` (filename extension) | iOS file picker may report `audio/mpeg` for m4a; filename extension is more reliable. |
| Swipe-to-delete gesture | Custom pointer event handlers (~50 LOC) | **Visible trash icon button** | Avoids the dependency tree entirely; matches the project's "trust the platform" ethos established in Phase 1 (native scroll-snap). |

**Key insight:** The whole phase has been deliberately scoped to land on tools the project already has (Howler, `useWakeLock`, native scroll-snap, Tailwind). The single new dep is `idb` — and even that is replacing what would otherwise be ~80 LOC of error-prone vanilla IDB code.

## Common Pitfalls

### Pitfall 1: Blob URL revoked before Howler finishes loading
**What goes wrong:** Howler's `onloaderror` fires; the audio never plays.
**Why it happens:** Developer revokes the URL right after constructing the Howl ("we already passed the src, we can free the URL").
**How to avoid:** Only revoke in the same code path that calls `howl.unload()`. Do not revoke on Howler `onload` either — Howler may re-fetch on `play()` in HTML5 mode.
**Warning signs:** "Sound failed to load" warnings in DevTools, silent player.

### Pitfall 2: Duration is `Infinity` for some user-uploaded files
**What goes wrong:** UI shows `Infinity:NaN` or `12:NaN`; row sort is broken.
**Why it happens:** Common with WebM, MediaRecorder output, some streaming formats. The MP3/M4A files most users will upload are usually fine, but VoiceMemos exports (m4a/AAC) have been seen to misbehave in older iOS Safari versions.
**How to avoid:** Use the seek-to-`MAX_SAFE_INTEGER` + `durationchange` fallback (Pattern 2 above).
**Warning signs:** Duration column shows `--:--` or huge numbers; reject the file with a friendly error if even the fallback returns non-finite.

### Pitfall 3: iOS Safari's 7-day eviction
**What goes wrong:** User uploads meditations, doesn't open the app for >7 days, returns to find an empty library.
**Why it happens:** [CITED: MDN Browser_storage_limits_and_eviction_criteria] Safari proactively evicts script-created storage from origins with no user interaction in the last 7 days.
**How to avoid:**
1. Encourage Add-to-Home-Screen (PWA installs use the same 60% origin quota and are less aggressively pruned).
2. Call `navigator.storage.persist()` once on first add — it's a no-op if already granted.
3. **Document this as a known limitation in v1** rather than building sync infrastructure.
**Warning signs:** "I lost all my meditations!" — first response: ask when they last opened the app.

### Pitfall 4: HTML5 audio mode required, but defaults to Web Audio
**What goes wrong:** First few seconds of a long meditation stall, or the file refuses to play because it can't decode in time.
**Why it happens:** Howler defaults to Web Audio mode (XHR + full decode). For user-supplied multi-MB files this is slow and memory-heavy.
**How to avoid:** Always pass `html5: true` for meditation playback. The existing `useBreathingAudio` hook also uses `html5: true` for the cue + music files — pattern is already established.
**Warning signs:** Long pre-play delay, memory spikes when switching meditations.

### Pitfall 5: Wake lock leaked when user starts meditation mid-breathing-session
**What goes wrong:** Calling `useWakeLock.activate()` while a sentinel from the breathing session is still held overwrites `sentinelRef.current`. The original sentinel can never be released, leaving a "phantom" wake lock until the page is closed.
**Why it happens:** `useWakeLock.request()` always assigns to `sentinelRef.current` without releasing the prior value (`src/hooks/useWakeLock.ts` lines 9-10).
**How to avoid (per D-18):** Either (a) the meditation player calls a new `wakeLock.releaseAndActivate()` (small hook change), or (b) plan-level ordering — e.g., the meditation play handler dispatches a `STOP` to the breathing reducer first if it's running. **Recommend (b)** because it preserves the existing hook contract and doesn't require Phase-6 to modify cross-cutting infrastructure. Document the rationale in the player hook's tests.
**Warning signs:** Phone never sleeps after the user finishes a meditation that overlapped a breathing session.

### Pitfall 6: File picker `change` not firing on re-pick of same file
**What goes wrong:** User picks `meditation1.mp3`, deletes it, picks `meditation1.mp3` again — nothing happens.
**Why it happens:** Browser sees the input value didn't change.
**How to avoid:** Reset `input.value = ''` in the change handler after extracting the file (Pattern 5 above).
**Warning signs:** "Add" works the first time but not the second.

### Pitfall 7: IndexedDB quota exceeded
**What goes wrong:** `add()` throws `QuotaExceededError`.
**Why it happens:** Cumulative Blob size hits the per-origin quota (60% of disk for installed PWAs — generous, but theoretically possible).
**How to avoid:** Wrap the `addMeditation` write in `try/catch`. On `QuotaExceededError`, surface a friendly toast/message ("Not enough storage — delete some meditations first"). Per Deferred Ideas, full quota UX is out of scope for v1.
**Warning signs:** First add works, later adds fail; usually for users with very full disks or who've uploaded many large meditations.

## Code Examples

(Already covered inline in Patterns 1–5 above. Reproduced here per template requirement.)

### Open IDB and list all meditations

```typescript
// Source: https://github.com/jakearchibald/idb README — Article store example adapted
import { openDB } from 'idb';

const dbPromise = openDB('buho-meditations', 1, {
  upgrade(db) {
    const store = db.createObjectStore('meditations', { keyPath: 'id' });
    store.createIndex('addedAt', 'addedAt');
  },
});

const list = await (await dbPromise).getAllFromIndex('meditations', 'addedAt');
```

### Extract duration from a File (handles Infinity)

See Pattern 2 above. Source: MDN HTMLMediaElement.duration page.

### Play a Blob through Howler

See Pattern 3 above. Source: Howler.js README (Core options) + MDN URL.createObjectURL.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vanilla IDB callbacks | `idb` Promise wrapper | 2017+ | ~80 LOC saved per CRUD op; correct transaction handling. |
| `localStorage` for app data | IndexedDB for binary, localStorage for small key-values | always, for binary | Required — localStorage caps at ~5MB and is string-only. |
| `FileReader.readAsDataURL` for audio | `URL.createObjectURL` + Blob | 2015+ | data: URLs are slower and bloat memory; Object URLs are pointers. |
| iOS PWA persistence questions | Storage API + persistence request | 2024+ | `navigator.storage.persist()` available on iOS Safari 17+; not a hard guarantee but improves chances. |

**Deprecated/outdated:**
- Bundling react-swipeable for swipe gestures: project already moved to native scroll-snap; the precedent argues against re-introducing a swipe library.
- NoSleep.js: per Phase 4 STATE notes, the project chose native Wake Lock API only (iOS 16.4+ universal). No fallback library needed for meditation playback.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | iOS Safari `<input type="file" accept="audio/*">` opens the Files sheet (Files / iCloud Drive / On My iPhone) | iOS file picker UX (focus 4) | If iOS shows only the Music library (DRM-protected, can't pick), import is broken. **Mitigation:** test on a real iOS 17+ device early in Wave 2; documented in Validation Architecture as a manual smoke test. [ASSUMED] |
| A2 | Howler in `html5: true` mode + Blob URL + `format: [...]` plays reliably on iOS Safari for m4a/mp3/wav | Pattern 3 / Pitfall 4 | If iOS rejects the Blob URL or format hint, fallback is to use a native `<audio>` element directly. **Mitigation:** smoke test with each common upload format on device. [ASSUMED] — based on Howler README + general HTML5 audio behavior, not a vendor-confirmed pairing. |
| A3 | `navigator.storage.persist()` improves persistence on installed iOS PWAs | Pitfall 3 | Even if it returns `true`, the 7-day rule may still apply. Treat as best-effort. [ASSUMED] — MDN says the request "automatically approve[s] or den[ies]"; web.dev article doesn't confirm Safari fully exempts from eviction. |
| A4 | `getAllFromIndex('addedAt')` returns ascending-by-addedAt order | Pattern 1 | Spec-defined: index iteration is in key order. [VERIFIED via idb docs + IndexedDB spec] — HIGH confidence. Per Q3 RESOLVED, the wrapper reverses the result to deliver newest-first to the UI. |
| A5 | Trash icon (vs swipe-to-delete) is the right v1 UX choice | Don't Hand-Roll / Standard Stack | If the user's preference is iOS-native swipe, plan changes to add a custom pointer-event swipe handler (~50 LOC). **Mitigation:** flag at gsd-discuss-phase or accept user feedback post-v1. [ASSUMED based on HIG general knowledge and project's "no extra deps" ethos] |
| A6 | `crypto.randomUUID()` is available on all target iOS versions in 2026 | Standard Stack > Supporting | If targeting <iOS 15.4, fall back to `Date.now() + Math.random().toString(36)`. [CITED: MDN compatibility table — iOS Safari 15.4+]. Project has already shipped APIs (Wake Lock) that are 16.4+, so 15.4 is safe. HIGH confidence. |

**Items needing user confirmation before/during planning:**
- A1 and A2 (iOS file picker + Howler+Blob behavior on real device) — flag in Validation Architecture as **mandatory device smoke tests**, plan for a fallback path if either fails.
- A5 (trash icon vs swipe-to-delete) — planner can lock based on this recommendation, but if the user later asks for swipe, treat as a small follow-up phase.

## Open Questions (RESOLVED)

1. **What MIME types and extensions does iOS's "Files" sheet actually surface for `accept="audio/*"`?**
   - What we know: documented to open Files sheet; in practice iCloud Drive and On My iPhone audio files are exposable.
   - What's unclear: whether DRM-protected Apple Music tracks are filtered out (they should be — DRM); whether VoiceMemos `.m4a` files always read duration cleanly.
   - **RESOLVED:** Defer to Plan 06-06 device smoke test (manual verification on a real iOS 17+ device — VoiceMemos `.m4a` and iCloud Drive `.mp3`). Captured in `06-VALIDATION.md` Manual-Only Verifications.

2. **Should we display total used storage / quota?**
   - What we know: deferred per CONTEXT.md ("Storage quota warnings / used-space display").
   - What's unclear: whether the user wants a minimal "X meditations stored" footer.
   - **RESOLVED:** Omit per CONTEXT.md `<deferred>` "Storage quota warnings". Inline `Not enough storage` toast on `QuotaExceededError` is the only surface.

3. **Sort order: oldest-first or newest-first?**
   - What we know: filename is the title, no manual ordering. CONTEXT.md doesn't specify.
   - **RESOLVED:** Newest-first (descending by `addedAt`). Most-recent uploads are most likely to be played. `listMeditations` reverses the index iteration result so the UI receives `[newest, …, oldest]`. Plan 06-03 Task 2 enforces this and adds a sort-order test in `meditations-db.test.ts`.

4. **Should `useMeditationPlayer` re-acquire wake lock on `visibilitychange`?**
   - What we know: `useWakeLock` already does this via `activeRef`. Setting `activeRef.current = true` on `activate()` covers it.
   - What's unclear: whether iOS reliably re-grants the lock when the meditation has been paused → backgrounded → foregrounded.
   - **RESOLVED:** Phase 4 behavior carries over — no Phase 6 hook change. Verify on real device in Plan 06-06 Task 3 (device smoke test, step G).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node + npm | Build / install | ✓ | as in package.json (Node 22+ inferred from Phase 5 STATE) | — |
| `idb` | New IDB layer | ✗ (not yet installed) | will install 8.0.3 | none — required dependency, install in Wave 1 |
| `howler` | Audio playback | ✓ | 2.2.4 | — |
| `vitest` + `jsdom` | Test framework | ✓ | 4.1.5 / 29.1.1 | — |
| `crypto.randomUUID` | UUID generation | ✓ (browser native, jsdom in tests) | iOS 15.4+ | `Date.now()+random` if jsdom polyfill missing |
| `URL.createObjectURL` | Blob → src | ✓ (browser native) | universal | — |
| `IndexedDB` | Persistence | ✓ (browser native; jsdom 29+ provides a working implementation) | iOS 14+ | — |
| `Wake Lock API` | Screen-on during playback | ✓ on iOS 16.4+ | already in use Phase 4 | logs warning, no fallback (per Phase 4 decision) |
| iOS Files app integration | File picker | ✓ (browser-native UI) | — | — |
| Real iOS device | Smoke testing | ⚠ user-provided | — | desktop Safari for build sanity, but device test is mandatory before sign-off |

**Missing dependencies with no fallback:**
- `idb` — must `npm install idb` in Wave 1.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.5 + @testing-library/react 16.3.2 + jsdom 29.1.1 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- src/__tests__/meditation-library.test.ts` (specific file) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| NAV-01 | 3 swipeable panels render | unit | `npm test -- navigation.test.tsx` | ✅ existing |
| NAV-02 | 3 page indicator dots render | unit | `npm test -- navigation.test.tsx` | ✅ existing |
| MEDT-01 | File picker triggers on "Add" button click | unit (RTL) | `npm test -- meditation-library.test.tsx -t "opens file picker"` | ❌ Wave 0 |
| MEDT-01 | Selected file is added to IDB with extracted duration | integration (jsdom + idb) | `npm test -- meditations-db.test.ts` | ❌ Wave 0 |
| MEDT-02 | Library list survives page reload (rehydrates from IDB) | integration | `npm test -- meditations-db.test.ts -t "rehydrate"` | ❌ Wave 0 |
| MEDT-03 | Empty state renders when no meditations exist | unit (RTL) | `npm test -- meditation-library.test.tsx -t "empty state"` | ❌ Wave 0 |
| MEDT-03 | Populated list renders rows with title + duration | unit (RTL) | `npm test -- meditation-library.test.tsx -t "list rows"` | ❌ Wave 0 |
| MEDT-04 | Tapping a row transitions library → playing view | unit (RTL) | `npm test -- meditation-screen.test.tsx -t "play tap"` | ❌ Wave 0 |
| MEDT-04 | Player constructs Howl with `html5:true`, format hint, and object URL | unit (mock Howler) | `npm test -- meditation-player.test.ts` | ❌ Wave 0 |
| MEDT-05 | Player UI renders title + elapsed/total time | unit (RTL) | `npm test -- meditation-player.test.tsx` | ❌ Wave 0 |
| MEDT-05 | Play/pause toggle calls `howl.play()` / `howl.pause()` | unit (mock Howler) | `npm test -- meditation-player.test.ts -t "toggle"` | ❌ Wave 0 |
| MEDT-05 | Stop returns to library view and unloads Howl | unit (mock Howler) | `npm test -- meditation-player.test.ts -t "stop"` | ❌ Wave 0 |
| MEDT-05 | `onend` auto-stops and returns to library | unit (mock Howler) | `npm test -- meditation-player.test.ts -t "onend"` | ❌ Wave 0 |
| MEDT-06 | Play activates wake lock; stop releases | unit (mock useWakeLock) | `npm test -- meditation-player.test.ts -t "wake lock"` | ❌ Wave 0 |
| MEDT-07 | Trash icon click removes record from IDB and list | unit (RTL + spy on IDB) | `npm test -- meditation-library.test.tsx -t "delete"` | ❌ Wave 0 |
| MEDT-08 | MeditationScreen uses sage `#5f7d60` background | unit (snapshot or query) | `npm test -- meditation-screen.test.tsx -t "aesthetic"` | ❌ Wave 0 |
| Cross-cutting | iOS device smoke (file picker, playback, persistence across reload, wake lock during playback) | manual on-device | n/a | ❌ checklist in PR description |

### Sampling Rate

- **Per task commit:** `npm test -- <relevant file>` — under 5 seconds for the meditation suite.
- **Per wave merge:** `npm test` — full suite, currently green; new tests must keep it green.
- **Phase gate:** Full suite + manual iOS device smoke checklist before `/gsd-verify-work`.

### State Invariants to Test

These are not requirement-bound but should be encoded as tests:

1. **No double wake lock:** when `MeditationPlayer` mounts/unmounts, it never calls `activate` twice in a row without `release` in between.
2. **No leaked object URLs:** every `createObjectURL` call has a paired `revokeObjectURL` call (test by spying).
3. **No leaked Howl instances:** every `new Howl` has a paired `unload()` call.
4. **Player and breathing session do not concurrently hold wake lock:** if breathing session is `running`, starting a meditation should either short-circuit OR explicitly stop the breathing session (per D-18 — planner picks).
5. **IDB add → list shows the new record:** after `addMeditation`, `listMeditations` includes it (round-trip integrity).

### Failure Modes Worth Probing

- **Corrupt audio file (text file renamed `.mp3`):** import flow rejects or shows error, never adds an unplayable record.
- **Audio file with `Infinity` duration:** seek-to-end fallback resolves to a finite duration, OR error toast is shown.
- **Oversized file (e.g., 200MB):** add succeeds (well under quota); play succeeds via HTML5 streaming.
- **IDB quota exceeded:** `add()` throws `QuotaExceededError` → user sees a friendly toast, library state remains consistent.
- **User picks the same file twice:** `change` event fires both times (because we reset `input.value`).
- **App backgrounded mid-playback:** Howler `html5` mode + iOS Safari handles this; wake lock is re-acquired on `visibilitychange` per existing hook.
- **User deletes the currently-playing meditation:** player should stop and return to library (planner: decide whether to allow delete-while-playing or disable that affordance).

### Wave 0 Gaps

- [ ] `src/__tests__/meditations-db.test.ts` — covers MEDT-01, MEDT-02 (IDB CRUD round-trip)
- [ ] `src/__tests__/meditation-library.test.tsx` — covers MEDT-01, MEDT-03, MEDT-07 (library UI: empty, list, add, delete)
- [ ] `src/__tests__/meditation-player.test.tsx` and `meditation-player.test.ts` — covers MEDT-04, MEDT-05, MEDT-06 (player UI + Howler/wake-lock integration)
- [ ] `src/__tests__/meditation-screen.test.tsx` — covers MEDT-04 (view transitions), MEDT-08 (aesthetic)
- [ ] No `conftest`-style shared fixtures needed; vitest setup files are empty and that's fine — keep IDB seeding in test-local helpers.
- [ ] Update existing `navigation.test.tsx` line 38 — current assertion expects placeholder text "Meditate"; this will fail once `MeditationScreen.tsx` is rewritten. Test should be revised to assert "Add meditation" button presence (empty state) when IDB is empty.
- [ ] Mock strategy for Howler: vitest `vi.mock('howler', ...)` returning a stub Howl class with `play/pause/stop/unload/seek/on` methods.
- [ ] Mock strategy for IDB in unit tests: jsdom 29 includes a working IndexedDB implementation, so prefer real `idb` calls with fresh DB names per test (`'buho-meditations-' + uuid`) to avoid cross-test pollution. For tests that don't need real IDB, mock `meditationsDB.ts` directly.

## Project Constraints (from CLAUDE.md)

The following directives from `CLAUDE.md` constrain Phase 6 plans. The planner MUST verify compliance.

- **No App Store dependency** — PWA only. ✓ no impact (existing).
- **Offline first** — must function fully offline after initial load. → IDB content is offline by definition; Howler `html5` reads from Blob URL (in-memory), no network. ✓
- **Wake lock during sessions** — apply this to meditation playback as well as breathing. → D-16 already mandates this; reuse `useWakeLock`. ✓
- **iOS audio autoplay restriction** — user gesture to start. → Tap on a list row IS a user gesture; Howler will unlock the AudioContext on that play. ✓
- **60fps animation** — meditation player has no animation per D-13 (text-only). ✓
- **"Avoid: Framer Motion (overkill for one circle), Lottie (external dependency)"** — applies broadly; do not introduce a heavy animation library for swipe-to-delete. → Recommendation **trash icon** complies. ✓
- **"vite-plugin-pwa (v1.x) — Zero-config service worker generation"** — verify the meditation route is cached if there's a route at all; in this app there are no routes, so the existing service worker config (which precaches all `**/*.{js,css,html,ico,png,svg,woff2,mp3}`) covers everything. The user-uploaded blobs are NOT precached, which is correct (they're user data, in IDB, not assets). ✓
- **Tailwind CSS 4 utility-first** — meditation components must use Tailwind classes consistent with breathing screen tokens (sage `#5f7d60`, ivory `#f5f0eb`, muted `#666666`). ✓
- **GSD Workflow Enforcement** — all file edits go through GSD plan tasks. → planner produces plans, executors run them. ✓

## Sources

### Primary (HIGH confidence)
- Context7 `/jakearchibald/idb` — README + test patterns (open, transaction, getAllFromIndex)
- Context7 `/goldfire/howler.js` — README (Core options src/format/html5/preload/load/unload)
- MDN `HTMLMediaElement.duration` — https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/duration (NaN/Infinity behavior, loadedmetadata/durationchange events)
- MDN `IndexedDB API > Browser storage limits` — https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria (iOS 60% PWA quota, 7-day eviction)
- MDN `<input type="file">` — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file (accept attribute, multiple, capture)
- npm registry — verified versions: `idb@8.0.3` (2025-05-07), `idb-keyval@6.2.5` (2026-06-02), `dexie@4.4.3` (2026-05-27), `howler@2.2.4`
- Local source — `src/hooks/useBreathingAudio.ts`, `src/hooks/useWakeLock.ts`, `src/hooks/useSettings.ts`, `src/types/breathing.ts`, `src/components/BreathingScreen.tsx`, `src/components/SwipeContainer.tsx`, `src/components/PageDots.tsx`, `src/components/MeditationScreen.tsx`, `src/__tests__/navigation.test.tsx`, `vite.config.ts`, `package.json`

### Secondary (MEDIUM confidence)
- web.dev `Persistent Storage` — https://web.dev/articles/persistent-storage (general guidance; iOS-specific behavior not confirmed by article)
- Apple HIG knowledge (general) on swipe-to-delete vs Edit-mode patterns — page content not retrievable, recommendation based on widely-published HIG guidance.

### Tertiary (LOW confidence)
- iOS Safari Files-sheet behavior with `accept="audio/*"` — documented widely in community sources but not in MDN or Apple official; flagged as A1 in Assumptions Log and as a mandatory device smoke test.
- Howler.js + Blob URL on iOS Safari — documented pattern is sound but no first-party Howler test fixture; flagged as A2.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package versions verified, all wrappers documented in Context7, idb is the canonical choice for promise-based IDB.
- Architecture: HIGH — patterns mirror existing `useBreathingAudio` / `useWakeLock` / `useSettings` precedents in the codebase.
- Pitfalls: HIGH — Pitfalls 1-4 are documented in MDN/Howler READMEs; Pitfall 5 (wake-lock leak) is verified by reading `src/hooks/useWakeLock.ts` directly.
- Validation Architecture: HIGH — vitest infrastructure already exists; gap is just writing the new test files.
- iOS-device-specific behavior (A1, A2): MEDIUM — relies on community knowledge + general API behavior, must be confirmed by on-device smoke test.

**Research date:** 2026-06-10
**Valid until:** 2026-07-10 (30 days; stack is stable, but iOS Safari quirks can shift across minor versions)
