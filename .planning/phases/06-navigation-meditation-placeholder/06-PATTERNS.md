# Phase 6: Navigation & Meditation Placeholder - Pattern Map

**Mapped:** 2026-06-10
**Files analyzed:** 13 (9 new + 4 modified) — IDB lib, 2 hooks, 4 components, 4 tests, 1 type module, plus orchestrator + nav test
**Analogs found:** 13 / 13 (every new file has at least one strong in-repo analog)

> **Important repo convention discovered:** tests live in `src/__tests__/`, NOT `tests/`. The `<files_to_read>` block listed `tests/lib/...` paths — the planner should override those to `src/__tests__/...` to match the existing repo layout (`src/__tests__/breathing-audio.test.ts`, `src/__tests__/wake-lock.test.ts`, etc.). All test patterns below assume `src/__tests__/`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/meditation.ts` | type module | (data shape) | `src/types/breathing.ts` | exact |
| `src/lib/meditationsDB.ts` | lib / data layer | CRUD (IndexedDB) | `src/hooks/useSettings.ts` (load/save module pattern) | role-match (storage instead of localStorage) |
| `src/hooks/useMeditationLibrary.ts` | hook | CRUD + state hydration | `src/hooks/useSessionTimer.ts` (state + ref + lifecycle) + reducer pattern from `useBreathingAnimation` | role-match |
| `src/hooks/useMeditationPlayer.ts` | hook | streaming / audio + wake-lock | `src/hooks/useBreathingAudio.ts` (Howler patterns) + `src/hooks/useWakeLock.ts` (compose) | exact |
| `src/components/MeditationScreen.tsx` (rewrite) | container component | view-state orchestration | `src/components/BreathingScreen.tsx` | exact |
| `src/components/MeditationLibrary.tsx` | presentational component | event-driven (onSelect / onAdd / onDelete) | `src/components/TimingControls.tsx` (sub-component composition) | role-match |
| `src/components/MeditationListRow.tsx` (implied by UI-SPEC) | presentational component | event-driven | `Stepper` inside `src/components/TimingControls.tsx` (small button-row pattern) | role-match |
| `src/components/MeditationPlayer.tsx` | presentational component | event-driven + aria-live time | `src/components/CountdownDisplay.tsx` + `src/components/MusicToggle.tsx` (icon button) | role-match |
| `src/components/AddMeditationButton.tsx` (implied) | presentational component | event-driven (file picker) | `src/components/MusicToggle.tsx` (button + aria-label pattern) | partial-match |
| `src/__tests__/meditations-db.test.ts` | test | integration (real IDB in jsdom) | `src/__tests__/settings-persistence.test.ts` (load/save round-trip) | role-match |
| `src/__tests__/meditation-player.test.ts` | test | unit + Howler mock + wake-lock mock | `src/__tests__/breathing-audio.test.ts` + `src/__tests__/wake-lock.test.ts` | exact |
| `src/__tests__/meditation-library.test.tsx` | test | RTL UI test | `src/__tests__/breathing-screen.test.tsx` | exact |
| `src/__tests__/meditation-screen.test.tsx` | test | RTL UI + view-state transitions | `src/__tests__/breathing-screen.test.tsx` | exact |
| `src/__tests__/navigation.test.tsx` (modify line 35-38) | test | RTL | (in-place revision) | exact |

## Pattern Assignments

### `src/types/meditation.ts` (type module)

**Analog:** `src/types/breathing.ts`

**Pattern to copy** — flat exported types + `DEFAULT_*` constants in one file (`src/types/breathing.ts` lines 1-42):

```typescript
// from src/types/breathing.ts:1-16
export type SessionState = 'idle' | 'running';

export interface BreathingConfig {
  inhale: number;  // seconds (min: 1, max: 60)
  // ...
}

export interface BreathingState {
  session: SessionState;
  config: BreathingConfig;
  musicEnabled: boolean;
  voiceEnabled: boolean;
}
```

**Apply to meditation:**

```typescript
// src/types/meditation.ts (proposed)
export type MeditationView = 'library' | 'playing';

export interface MeditationRecord {
  id: string;          // crypto.randomUUID()
  filename: string;    // original filename, used as title (D-08)
  duration: number;    // seconds, extracted on import (D-07)
  blob: Blob;          // audio binary in IDB
  addedAt: number;     // Date.now() — used as sort index
}

export interface MeditationState {
  view: MeditationView;
  selectedId: string | null;
  meditations: MeditationRecord[];
}
```

Same convention: types + constants live together; no class-based modeling; structural typing.

---

### `src/lib/meditationsDB.ts` (lib, CRUD over IndexedDB)

**Analog:** `src/hooks/useSettings.ts` — module exporting pure load/save functions, no React.

**Imports/structure pattern** (`src/hooks/useSettings.ts` lines 1-10):

```typescript
import type { BreathingConfig } from '../types/breathing';
import { DEFAULT_CONFIG, MIN_SECONDS, MAX_SECONDS, MIN_DURATION, MAX_DURATION } from '../types/breathing';

const STORAGE_KEY = 'buho-settings';

interface PersistedSettings {
  config: BreathingConfig;
  musicEnabled: boolean;
  voiceEnabled: boolean;
}
```

**Error handling pattern** (`src/hooks/useSettings.ts` lines 22-43) — try/catch returns sane defaults, never throws to caller:

```typescript
export function loadSettings(): { config: BreathingConfig; musicEnabled: boolean; voiceEnabled: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { config: { ...DEFAULT_CONFIG }, musicEnabled: true, voiceEnabled: true };
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      config: clampConfig(parsed.config || {}),
      musicEnabled: parsed.musicEnabled ?? true,
      voiceEnabled: parsed.voiceEnabled ?? true,
    };
  } catch {
    return { config: { ...DEFAULT_CONFIG }, musicEnabled: true, voiceEnabled: true };
  }
}

export function saveSettings(config: BreathingConfig, musicEnabled: boolean, voiceEnabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, musicEnabled, voiceEnabled }));
  } catch {
    // localStorage full or unavailable -- silently ignore
  }
}
```

**Apply to IDB layer:** wrap `idb` calls; catch `QuotaExceededError`; use module-level constants for db name/version/store; lazy-open on first call (per RESEARCH.md Pattern 1).

```typescript
// src/lib/meditationsDB.ts (proposed — RESEARCH.md Pattern 1, mirrored)
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

export async function listMeditations(): Promise<MeditationRecord[]> { /* getAllFromIndex */ }
export async function addMeditation(record: MeditationRecord): Promise<void> { /* db.add */ }
export async function deleteMeditation(id: string): Promise<void> { /* db.delete */ }
export async function getMeditation(id: string): Promise<MeditationRecord | undefined> { /* db.get */ }
```

**Constants naming convention** to follow: `DB_NAME = 'buho-meditations'` matches `STORAGE_KEY = 'buho-settings'` (`src/hooks/useSettings.ts` line 5).

---

### `src/hooks/useMeditationLibrary.ts` (hook, CRUD + hydration)

**Analog:** `src/hooks/useSessionTimer.ts` (state + ref + lifecycle hook) — chosen because it's the smallest stateful hook in the repo and already pairs `useState` with `useRef` and `useCallback`.

**Hook shape pattern** (`src/hooks/useSessionTimer.ts` lines 1-41):

```typescript
import { useRef, useCallback, useEffect, useState } from 'react';

export function useSessionTimer(onComplete: () => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(0);
  const [remaining, setRemaining] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = useCallback(() => { /* ... */ }, []);
  const start = useCallback((durationMinutes: number) => { /* ... */ }, [clear]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { remaining, start, clear };
}
```

**Lazy-hydrate-on-mount pattern** (`src/components/BreathingScreen.tsx` lines 14-17, but adapted):

```typescript
// from src/components/BreathingScreen.tsx:14-17 — module-level eager load + spread
const initialState: BreathingState = {
  session: 'idle',
  ...loadSettings(),
};
```

**For IDB (async, can't be module-level):** use the canonical `useEffect` + `useState` hydration:

```typescript
// useMeditationLibrary.ts (proposed)
const [meditations, setMeditations] = useState<MeditationRecord[]>([]);
const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  let cancelled = false;
  listMeditations().then((list) => {
    if (!cancelled) {
      setMeditations(list);
      setHydrated(true);
    }
  });
  return () => { cancelled = true; };
}, []);

const add = useCallback(async (record: MeditationRecord) => {
  await addMeditation(record);
  setMeditations((prev) => [...prev, record]);
}, []);

const remove = useCallback(async (id: string) => {
  await deleteMeditation(id);
  setMeditations((prev) => prev.filter((m) => m.id !== id));
}, []);

return { meditations, hydrated, add, remove };
```

The `cancelled` flag pattern is standard React; the project hasn't used it yet because all current hydrations are synchronous (`localStorage`). Planner should treat this as the single new pattern this hook introduces.

**Returned-object convention** — destructured action fns + state: `{ remaining, start, clear }` (line 40) and `{ start, stop, windDown, fadeMusic, toggleMusic, toggleVoice }` (`useBreathingAudio.ts` line 154). Mirror as `{ meditations, hydrated, add, remove }`.

---

### `src/hooks/useMeditationPlayer.ts` (hook, streaming audio + wake-lock)

**Analog:** `src/hooks/useBreathingAudio.ts` — Howler imports, lifecycle, ref-based instances. **Exact match.**

**Imports + ref pattern** (`src/hooks/useBreathingAudio.ts` lines 1-15):

```typescript
import { useRef, useCallback, useEffect } from 'react';
import { Howl, Howler } from 'howler';
import type { BreathingConfig } from '../types/breathing';

export function useBreathingAudio() {
  const cuesRef = useRef<{ in: Howl; hold: Howl; out: Howl } | null>(null);
  const musicRef = useRef<Howl | null>(null);
  // ...
```

**Howler instance + cleanup pattern** (lines 17-40):

```typescript
useEffect(() => {
  cuesRef.current = {
    in: new Howl({ src: ['/audio/breathe-in.mp3'], html5: true, preload: true }),
    // ...
  };
  musicRef.current = new Howl({
    src: ['/audio/meditation.mp3'],
    html5: true,
    loop: false,
    preload: true,
    volume: 0.4,
    onend: () => { musicNeedsRestartRef.current = true; },
  });

  return () => {
    cuesRef.current?.in.unload();
    cuesRef.current?.hold.unload();
    cuesRef.current?.out.unload();
    musicRef.current?.unload();
  };
}, []);
```

**Apply to meditation player:** the Howl is constructed lazily on `play(blob, filename)` (not on mount — we don't have the blob until the user picks a meditation). Mirror the **`html5: true`** flag, the **`preload: true`** flag, the **`onend` callback**, and the **`unload()` in cleanup**. RESEARCH.md Pattern 3 covers Blob-URL specifics (`format: [...]` hint, revoke-after-unload).

**iOS audio unlock pattern** (`useBreathingAudio.ts` lines 89-93):

```typescript
// Unlock iOS AudioContext — must happen synchronously in user gesture
const ctx = Howler.ctx;
if (ctx && ctx.state !== 'running') {
  ctx.resume();
}
```

Replicate verbatim inside `useMeditationPlayer.play()` — the row tap is a user gesture.

**Multiple instance/Howl tracking pattern** — `useBreathingAudio` uses one ref per Howl. The meditation player has at most one playing meditation at a time, so one `howlRef` + one `urlRef` (for the object URL):

```typescript
// useMeditationPlayer.ts (proposed)
const howlRef = useRef<Howl | null>(null);
const urlRef = useRef<string | null>(null);
const [isPlaying, setIsPlaying] = useState(false);
const [elapsed, setElapsed] = useState(0);
const { activate: wakeActivate, release: wakeRelease } = useWakeLock();
```

**Compose `useWakeLock`** (`src/components/BreathingScreen.tsx` line 23 — composing in container; here we compose in the hook itself because the player hook owns the playback lifecycle):

```typescript
// Reference: BreathingScreen.tsx line 23 — useWakeLock destructured at component level
const { activate: wakeLockActivate, release: wakeLockRelease } = useWakeLock();
// In meditation player hook, call wakeActivate() inside play(), wakeRelease() inside pause/stop/onend.
```

**Elapsed-time interval pattern** — RESEARCH.md Pattern 4 (250ms `setInterval` polling `howl.seek()`). The repo's analog for setInterval-driven UI state is `useSessionTimer.ts` lines 23-31 (1s tick decrementing `remaining`). Apply the same `useEffect` + cleanup shape:

```typescript
// from useSessionTimer.ts:24-32 (analog for setInterval lifecycle)
intervalRef.current = setInterval(() => {
  remainingRef.current -= 1;
  setRemaining(remainingRef.current);
  if (remainingRef.current <= 0) {
    clear();
    onCompleteRef.current();
  }
}, 1000);
```

**Returned API:** `{ play, pause, stop, isPlaying, elapsed, duration }` (planner: confirm — RESEARCH.md says `{play, pause, stop, elapsed, isPlaying}`; including `duration` only if the hook stores it).

**Critical patterns from RESEARCH.md to fold in here (not from existing repo, but research-cited):**
- `URL.createObjectURL(blob)` + `format: [getFormatFromFilename(filename)]` (REQUIRED for Blob URLs)
- `URL.revokeObjectURL(url)` AFTER `howl.unload()`, never before
- `html5: true` (matches existing `useBreathingAudio.ts:19,24`)

---

### `src/components/MeditationScreen.tsx` (rewrite — container)

**Analog:** `src/components/BreathingScreen.tsx` — exact role match (panel-level container that composes hooks + sub-components).

**Imports pattern** (`src/components/BreathingScreen.tsx` lines 1-12):

```typescript
import { useReducer, useEffect, useCallback, useRef } from 'react';
import { BreathingCircle } from './BreathingCircle';
import { TimingControls } from './TimingControls';
import { CountdownDisplay } from './CountdownDisplay';
import { MusicToggle } from './MusicToggle';
import { VoiceToggle } from './VoiceToggle';
import { useBreathingAnimation, breathingReducer } from '../hooks/useBreathingAnimation';
import { useBreathingAudio } from '../hooks/useBreathingAudio';
import { useWakeLock } from '../hooks/useWakeLock';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { loadSettings, saveSettings } from '../hooks/useSettings';
import type { BreathingState } from '../types/breathing';
```

Mirror with: `useState` (per RESEARCH.md — "useState shape simpler than reducer here"), `MeditationLibrary`, `MeditationPlayer`, `useMeditationLibrary`, `useMeditationPlayer`, `MeditationRecord` from `../types/meditation`.

**Panel root pattern** (`src/components/BreathingScreen.tsx` lines 78-84) — must be preserved verbatim from the current placeholder:

```typescript
<div
  data-panel="breathing"  // → data-panel="meditation"
  data-session={state.session}  // → data-view={state.view}
  aria-label="Breathing"  // → aria-label="Meditation"
  className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex items-center justify-center bg-[#5f7d60] relative"
>
```

The current `MeditationScreen.tsx` (lines 4-7) already uses this pattern; the rewrite **must keep the `data-panel`, `aria-label`, `w-screen h-dvh flex-shrink-0 snap-start snap-always bg-[#5f7d60]` chain** (canonical refs: UI-SPEC line 50).

**Hook composition + handler pattern** (`src/components/BreathingScreen.tsx` lines 22-23, 49-64):

```typescript
const { start: audioStart, stop: audioStop, /* ... */ } = useBreathingAudio();
const { activate: wakeLockActivate, release: wakeLockRelease } = useWakeLock();

const handleCircleTap = () => {
  if (state.session === 'idle') {
    dispatch({ type: 'START' });
    start(state.config);
    audioStart(state.config);
    wakeLockActivate();
    timerStart(state.config.duration);
  } else {
    dispatch({ type: 'STOP' });
    stop();
    audioStop();
    wakeLockRelease();
    timerClear();
  }
};
```

**Apply to MeditationScreen:** the `handleSelect(id)`, `handleBack()`, `handleAdd(file)`, `handleDelete(id)` handlers follow the same shape — dispatch state change + call hook actions. Wake-lock activation moves into `useMeditationPlayer.play()` per the design (UI-SPEC line 322 + D-16) but the composition pattern is the same.

**View-state branching** — new pattern (the breathing screen doesn't switch sub-components, it shows/hides via `visible` props). For meditation, render-branch:

```typescript
return (
  <div data-panel="meditation" /* ... */>
    {state.view === 'library'
      ? <MeditationLibrary meditations={meditations} onSelect={handleSelect} onAdd={handleAdd} onDelete={handleDelete} />
      : <MeditationPlayer meditation={selected} onBack={handleBack} player={player} />
    }
  </div>
);
```

---

### `src/components/MeditationLibrary.tsx` (presentational)

**Analog:** `src/components/TimingControls.tsx` — small composition of stateless sub-components (the inline `Stepper` is the closest "list item with controls" pattern in the repo).

**Import + props pattern** (`src/components/TimingControls.tsx` lines 1-11, 42-46):

```typescript
import type { BreathingConfig, BreathingAction } from '../types/breathing';
// ...
interface TimingControlsProps {
  config: BreathingConfig;
  dispatch: React.Dispatch<BreathingAction>;
  visible: boolean;
}

export function TimingControls({ config, dispatch, visible }: TimingControlsProps) {
```

**Mirror as:**

```typescript
import type { MeditationRecord } from '../types/meditation';

interface MeditationLibraryProps {
  meditations: MeditationRecord[];
  onSelect: (id: string) => void;
  onAdd: (file: File) => void;
  onDelete: (id: string) => void;
}
```

**Tailwind layout convention** (`src/components/TimingControls.tsx` lines 49-56):

```typescript
<div
  data-testid="timing-controls"
  className={`absolute top-[15%] left-0 right-0 px-4 flex flex-col items-center transition-opacity duration-500 ${
    visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`}
  aria-hidden={!visible}
>
```

**Apply to library:** UI-SPEC §"State A: Library (Empty)" + §"State B: Library (Populated)" dictates exact layouts. Use the same flex-flow conventions (`flex flex-col items-center justify-center` for empty state; `flex flex-col`, `flex-1 overflow-y-auto`, `px-4` for list).

**Empty-state copy pattern** — preserve current placeholder convention from `MeditationScreen.tsx:8-10`:

```typescript
<p className="text-base font-normal text-[#666666]">
  Meditate
</p>
```

Replace with the empty-state heading + sub-line per UI-SPEC §"State A":
- `text-base text-white/60` for "No meditations yet"
- `text-sm text-[#666666]` for "Add your first recording"

---

### `src/components/MeditationListRow.tsx` (presentational, implied by UI-SPEC)

**Analog:** the inline `Stepper` component inside `src/components/TimingControls.tsx` lines 13-40 — same "small inline button row" pattern.

**Pattern** (`src/components/TimingControls.tsx` lines 14-40):

```typescript
function Stepper({ label, value, min, max, onChange, suffix }: StepperProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-white/60 text-xs uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-white/30 text-white flex items-center justify-center disabled:opacity-30 active:bg-white/10"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        {/* ... */}
      </div>
    </div>
  );
}
```

**Apply to MeditationListRow:** `flex items-center justify-between min-h-14 px-4 py-3 ...` per UI-SPEC §"MeditationListRow Layout" (lines 215-230). Mirror the **active:bg-white/N**, **transition-colors duration-150**, **text-white/60**, **tabular-nums** conventions:

```typescript
// Apply (UI-SPEC §MeditationListRow):
<button
  onClick={() => onSelect(meditation.id)}
  className="w-full flex items-center justify-between min-h-14 px-4 py-3 active:bg-white/5 transition-colors duration-150 border-b border-white/10"
>
  <span className="text-sm font-normal text-white truncate flex-1 mr-4">{meditation.filename}</span>
  <span className="text-sm font-normal text-white/60 tabular-nums shrink-0 mr-2">{formatTime(meditation.duration)}</span>
  <button onClick={(e) => { e.stopPropagation(); onDelete(meditation.id); }} aria-label={`Delete ${meditation.filename}`} className="w-10 h-10 flex items-center justify-center text-[#e08080]/70 active:text-[#e08080] transition-colors">
    {/* trash SVG */}
  </button>
</button>
```

**Tap-through prevention** — note the inline `e.stopPropagation()` pattern. UI-SPEC §"Tap-Through Prevention" lines 311-313 mandates it.

---

### `src/components/MeditationPlayer.tsx` (presentational)

**Analog:** `src/components/CountdownDisplay.tsx` (time formatting + `aria-live`) + `src/components/MusicToggle.tsx` (icon button + ARIA pattern).

**Time-formatting + aria-live pattern** (`src/components/CountdownDisplay.tsx` lines 6-25):

```typescript
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function CountdownDisplay({ remainingSeconds, visible }: CountdownDisplayProps) {
  return (
    <div
      data-testid="countdown-display"
      aria-hidden={!visible}
      aria-live={visible ? 'polite' : undefined}
      className={`absolute top-[calc(50%+140px)] left-0 right-0 text-center text-white/60 text-sm tabular-nums transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {visible ? formatTime(remainingSeconds) : ''}
    </div>
  );
}
```

**Apply:** UI-SPEC §"Time-Format Display — Locked: M:SS" (lines 290-301) explicitly says **extract `formatTime` to `src/lib/formatTime.ts`** and have both `CountdownDisplay` and `MeditationPlayer` import from it. The planner should treat this extraction as a small refactor task in Wave 1.

**Icon-button + ARIA pattern** (`src/components/MusicToggle.tsx` lines 6-29):

```typescript
export function MusicToggle({ enabled, onToggle }: MusicToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={enabled ? 'Mute background music' : 'Unmute background music'}
      aria-pressed={enabled}
      className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] right-8 w-10 h-10 flex items-center justify-center text-white/70 active:text-white transition-colors"
    >
      {enabled ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* icon paths */}
        </svg>
      ) : (
        <svg /* ... */>
          {/* icon paths */}
        </svg>
      )}
    </button>
  );
}
```

**Apply to play/pause control + back chevron** — UI-SPEC §"Meditation Player" (lines 186-213) specifies:
- 96×96 ivory disc (`w-24 h-24 bg-[#f5f0eb] rounded-full`)
- 24×24 stroke-2 SVG using the **same `xmlns/viewBox/fill="none"/stroke="currentColor"/strokeWidth="2"/strokeLinecap="round"/strokeLinejoin="round"`** convention as `MusicToggle.tsx:15` and `VoiceToggle.tsx:15`.
- `aria-label="Play meditation"` / `"Pause meditation"` toggling on `isPlaying`.
- Back chevron at top-left mirrors the **bottom-corner toggle pattern** but at `top-4 left-4 + env(safe-area-inset-top)`.

**`text-white/70 active:text-white transition-colors`** is the canonical "interactive but resting" treatment — applies to the back chevron exactly.

---

### `src/components/AddMeditationButton.tsx` (presentational, implied)

**Analog:** `src/components/MusicToggle.tsx` (button + ARIA structure) — partial match (button, not icon-only).

**Pattern:** RESEARCH.md Pattern 5 (hidden file input + button trigger). Combine with UI-SPEC §"AddMeditationButton" (lines 269-287) for visual:

```typescript
// RESEARCH.md Pattern 5 + UI-SPEC line 281:
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
          e.target.value = '';   // Pitfall 6: re-pick same file
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        aria-label="Add meditation"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white text-sm font-normal active:bg-white/10 transition-colors min-h-11"
      >
        {/* 16×16 plus SVG */}
        Add meditation
      </button>
    </>
  );
}
```

**Reuse `border-white/30` + `active:bg-white/10` + `disabled:opacity-30`** — already canonical in `TimingControls.tsx:21,32` (Stepper buttons).

---

### `src/__tests__/meditations-db.test.ts` (test, IDB integration)

**Analog:** `src/__tests__/settings-persistence.test.ts` — module-level mock + load/save round-trip.

**Test scaffolding pattern** (`src/__tests__/settings-persistence.test.ts` lines 36-48):

```typescript
describe('Settings persistence (SETT-02)', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    });
  });
```

**Apply to IDB:** RESEARCH.md §"Wave 0 Gaps" recommends using **real `idb` calls in jsdom 29 with fresh DB names per test** (`'buho-meditations-' + uuid`) to avoid pollution. Scaffold:

```typescript
// src/__tests__/meditations-db.test.ts (proposed)
import { describe, it, expect, beforeEach } from 'vitest';
import { openDB } from 'idb';

describe('meditationsDB (MEDT-01, MEDT-02)', () => {
  beforeEach(async () => {
    // Wipe the DB by deleting its database file (jsdom 29 supports this).
    await indexedDB.deleteDatabase('buho-meditations');
  });

  it('addMeditation + listMeditations round-trip preserves blob and metadata', async () => {
    /* ... */
  });

  it('listMeditations returns records sorted by addedAt ascending', async () => {
    /* ... */
  });

  it('deleteMeditation removes the record', async () => {
    /* ... */
  });
});
```

**Round-trip assertion shape** (matches `settings-persistence.test.ts` lines 80-89):

```typescript
it('writes JSON to localStorage under key "buho-settings"', () => {
  const config = { /* ... */ };
  saveSettings(config, false);
  const stored = localStorage.getItem('buho-settings');
  expect(stored).not.toBeNull();
  const parsed = JSON.parse(stored!);
  expect(parsed.config).toEqual(config);
});
```

---

### `src/__tests__/meditation-player.test.ts` (test, Howler + wake-lock unit)

**Analog:** `src/__tests__/breathing-audio.test.ts` (Howler mock) + `src/__tests__/wake-lock.test.ts` (wake-lock mock). **Exact match.**

**Howler mock pattern** (`src/__tests__/breathing-audio.test.ts` lines 1-29):

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock howler module
const mockPlay = vi.fn().mockReturnValue(1);
const mockStop = vi.fn();
const mockMute = vi.fn();
const mockUnload = vi.fn();

vi.mock('howler', () => {
  const MockHowl = vi.fn(function (this: Record<string, unknown>) {
    this.play = mockPlay;
    this.stop = mockStop;
    this.mute = mockMute;
    this.on = vi.fn();
    this.once = vi.fn();
    this.unload = mockUnload;
  });
  return {
    Howl: MockHowl,
    Howler: {
      ctx: { state: 'running', resume: vi.fn() },
      autoUnlock: true,
    },
  };
});
```

**Apply to meditation player tests:** copy this mock verbatim, **add `mockSeek`** (returns numeric for elapsed-time polling) and **`mockPause`**:

```typescript
const mockSeek = vi.fn().mockReturnValue(0);
const mockPause = vi.fn();
// ... inside MockHowl constructor:
this.seek = mockSeek;
this.pause = mockPause;
```

**Wake lock mock pattern** (`src/__tests__/wake-lock.test.ts` lines 16-35):

```typescript
beforeEach(() => {
  mockSentinel = {
    released: false,
    type: 'screen' as const,
    release: vi.fn().mockImplementation(() => {
      mockSentinel.released = true;
      return Promise.resolve();
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onrelease: null,
  };

  Object.defineProperty(navigator, 'wakeLock', {
    value: { request: vi.fn().mockResolvedValue(mockSentinel) },
    writable: true,
    configurable: true,
  });
});
```

**Hook test pattern** (`src/__tests__/breathing-audio.test.ts` lines 67-87 — fake timers + renderHook + act):

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  mockPlay.mockClear();
  // ...
});
afterEach(() => { vi.useRealTimers(); });

it('breathe in cue plays after initial 800ms delay', async () => {
  const { useBreathingAudio } = await import('../hooks/useBreathingAudio');
  const { result } = renderHook(() => useBreathingAudio());

  act(() => {
    result.current.start({ inhale: 4, holdIn: 4, exhale: 4, holdOut: 0, duration: 5 });
  });
  act(() => { vi.advanceTimersByTime(800); });
  expect(mockPlay).toHaveBeenCalled();
});
```

**Apply:** test `play(blob, filename)`, `pause()`, `stop()`, `onend` natural close, wake-lock activation/release, elapsed-time interval polling. RESEARCH.md §"State Invariants to Test" lines 635-643 enumerates exactly the assertions needed.

---

### `src/__tests__/meditation-library.test.tsx` (test, RTL UI)

**Analog:** `src/__tests__/breathing-screen.test.tsx` — RTL render, `data-testid` queries, `fireEvent.click`.

**Setup pattern** (`src/__tests__/breathing-screen.test.tsx` lines 1-13):

```typescript
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { BreathingScreen } from '../components/BreathingScreen';

beforeAll(() => {
  Element.prototype.animate = vi.fn().mockReturnValue({
    onfinish: null,
    cancel: vi.fn(),
    finished: Promise.resolve(),
  });
});
```

**Render + interaction pattern** (`src/__tests__/breathing-screen.test.tsx` lines 21-27):

```typescript
it('tapping circle starts a session (D-09, BRTH-04)', () => {
  const { container } = render(<BreathingScreen />);
  const circle = container.querySelector('[data-testid="breathing-circle"]') as HTMLElement;
  fireEvent.click(circle);
  expect(circle.closest('[data-session]')?.getAttribute('data-session')).toBe('running');
});
```

**Apply to MeditationLibrary tests:**
- Mock `meditationsDB.ts` (vi.mock) so component-level tests don't hit real IDB.
- Empty state: render with `meditations=[]`, assert "Add meditation" button + "No meditations yet" copy present.
- Populated state: render with mock array, assert row count + filename text + duration text + trash buttons.
- Delete flow: `fireEvent.click(trashButton)` → assert inline confirmation appears → `fireEvent.click(confirmDelete)` → assert `onDelete` callback invoked with id.
- Add flow: `fireEvent.change` on the file input with a `new File([blob], 'test.mp3', {type:'audio/mpeg'})`, assert `onAdd` callback fires.

---

### `src/__tests__/meditation-screen.test.tsx` (test, view-state + integration)

**Analog:** `src/__tests__/breathing-screen.test.tsx` (lines 51-55) — panel attribute assertion.

```typescript
it('preserves data-panel attribute for navigation (existing contract)', () => {
  const { container } = render(<BreathingScreen />);
  const panel = container.querySelector('[data-panel="breathing"]');
  expect(panel).not.toBeNull();
});
```

**Apply:** assert `[data-panel="meditation"]`, `aria-label="Meditation"`, sage `bg-[#5f7d60]` background. Plus view-state transitions:
- Initial state with empty list → library view rendered.
- Initial state with populated list + `fireEvent.click(row)` → player view rendered.
- Player → tap back → library view restored.
- `data-view` attribute (proposed) toggles `library` ↔ `playing`.

---

### `src/__tests__/navigation.test.tsx` (modify lines 35-38)

**Current** (`src/__tests__/navigation.test.tsx` lines 35-38):

```typescript
it('renders meditation screen with placeholder text (D-15)', () => {
  render(<App />);
  expect(screen.getByText('Meditate')).toBeDefined();
});
```

**Modification** — RESEARCH.md "Wave 0 Gaps" line 661 specifies:

> "Update existing `navigation.test.tsx` line 38 — current assertion expects placeholder text 'Meditate'; this will fail once `MeditationScreen.tsx` is rewritten. Test should be revised to assert 'Add meditation' button presence (empty state) when IDB is empty."

```typescript
it('renders meditation screen with empty-state add button (MEDT-03)', async () => {
  render(<App />);
  // App boots with empty IDB → MeditationScreen shows empty state → "Add meditation" button visible
  expect(await screen.findByRole('button', { name: /add meditation/i })).toBeDefined();
});
```

Note: `findByRole` (async) is needed because `useMeditationLibrary` hydrates from IDB asynchronously on mount.

---

## Shared Patterns

### Panel Root Pattern (cross-cutting)

**Source:** `src/components/MeditationScreen.tsx` lines 4-7 (current placeholder), `src/components/BreathingScreen.tsx` lines 79-84.
**Apply to:** the rewritten `MeditationScreen.tsx`.

```typescript
<div
  data-panel="meditation"
  aria-label="Meditation"
  className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex items-center justify-center bg-[#5f7d60] relative"
>
```

The `data-panel`, `aria-label`, `w-screen h-dvh flex-shrink-0 snap-start snap-always bg-[#5f7d60]` chain is the integration contract between `SwipeContainer` and panel children. Any deviation breaks page-dot logic and existing `navigation.test.tsx` (line 8: `container.querySelectorAll('[data-panel]')`).

### Tailwind Color/Opacity Convention (cross-cutting)

**Source:** `src/components/MusicToggle.tsx` line 12, `src/components/TimingControls.tsx` line 16, `src/components/CountdownDisplay.tsx` line 18.
**Apply to:** every new meditation component.

| Use | Class |
|-----|-------|
| Primary text/icon | `text-white` |
| Interactive resting | `text-white/70 active:text-white transition-colors` |
| Labels / metadata | `text-white/60` |
| Disabled / placeholder | `text-white/30` (or `disabled:opacity-30` per `TimingControls.tsx:21`) |
| Muted body copy | `text-[#666666]` |
| Pressed surface | `active:bg-white/10` (Stepper) or `active:bg-white/5` (list rows per UI-SPEC) |
| Destructive (Phase 6 NEW) | `text-[#e08080]/70 active:text-[#e08080]` — trash + Delete confirmation only |
| Time strings | always `tabular-nums` |

UI-SPEC §"Color" (lines 76-99) locks this — destructive coral `#e08080` is the **single new hex** introduced in Phase 6.

### Icon SVG Convention (cross-cutting)

**Source:** `src/components/MusicToggle.tsx` line 15, `src/components/VoiceToggle.tsx` line 15.
**Apply to:** every SVG in `MeditationListRow` (trash), `MeditationPlayer` (play/pause/back), `AddMeditationButton` (plus).

```typescript
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  {/* paths */}
</svg>
```

Inline SVG only — no icon library (UI-SPEC line 23 + CLAUDE.md "Avoid: Lottie (external dependency)").

### Time Formatting (cross-cutting)

**Source:** `src/components/CountdownDisplay.tsx` lines 6-10.
**Apply to:** **extract to `src/lib/formatTime.ts`** (UI-SPEC line 299) and import in both `CountdownDisplay` (existing) and `MeditationListRow` + `MeditationPlayer` (new).

```typescript
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

UI-SPEC mandates `M:SS` everywhere; for durations ≥ 60 min, planner adds an `H:MM:SS` branch (UI-SPEC line 292).

### Wake-Lock Composition (cross-cutting)

**Source:** `src/components/BreathingScreen.tsx` lines 23, 56, 62.
**Apply to:** `useMeditationPlayer` hook (per D-16 — activate on play, release on pause/stop/end/back).

```typescript
const { activate: wakeLockActivate, release: wakeLockRelease } = useWakeLock();
// ...
wakeLockActivate();   // on play
wakeLockRelease();    // on pause, stop, back, onend
```

**Known footgun** (RESEARCH.md Pitfall 5): `useWakeLock.activate()` overwrites `sentinelRef.current` without releasing the prior sentinel. D-18 says trust the user to stop breathing first; planner should encode this as a documented test invariant (RESEARCH.md State Invariant #4) — no shared-hook modification this phase.

### Test File Convention (cross-cutting)

**Source:** all existing tests under `src/__tests__/`.
**Apply to:** all new test files — place under `src/__tests__/`, NOT `tests/` (despite the `<files_to_read>` block listing `tests/` paths).

Convention:
- `*.test.ts` for hook/lib tests (no JSX).
- `*.test.tsx` for component tests (with JSX + RTL).
- vitest globals (`describe`, `it`, `expect`, `vi`) imported explicitly per file.
- Module mocks via `vi.mock('howler', () => ...)` at top-level (hoisted).
- Browser API stubs via `Object.defineProperty(navigator, ..., { writable: true, configurable: true })` (per `wake-lock.test.ts:30-34`).
- Fake timers via `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`.

### Hook Return-Object Convention

**Source:** `src/hooks/useBreathingAudio.ts:154`, `src/hooks/useSessionTimer.ts:40`, `src/hooks/useWakeLock.ts:54`.
**Apply to:** both new hooks.

Hooks return a flat object of **callbacks + reactive state values**, never a tuple. Destructured at call site with renaming when names collide (e.g. `BreathingScreen.tsx:22` `{ start: audioStart, stop: audioStop, ... }`). Apply identically to `useMeditationLibrary` and `useMeditationPlayer`.

### IDs / Constants Naming

**Source:** `src/hooks/useSettings.ts:5` (`STORAGE_KEY = 'buho-settings'`).
**Apply to:** IDB layer.

`buho-`-prefixed module-level constants for storage keys / DB names. RESEARCH.md Pattern 1 already uses `buho-meditations` — consistent.

---

## No Analog Found

Every new file has at least a partial analog. The genuinely **new patterns** Phase 6 introduces (without prior precedent in the repo) — flagged so the planner explicitly references RESEARCH.md for these:

| Pattern | Reason | Source for Planner |
|---------|--------|--------------------|
| `idb` library usage (open, getAllFromIndex, transactions) | First IDB usage in the project | RESEARCH.md Pattern 1 (lines 245-292) |
| `URL.createObjectURL(blob)` + `URL.revokeObjectURL` lifecycle | First Blob-URL usage in the project | RESEARCH.md Pattern 3 (lines 339-380) + Pitfall 1 |
| `<input type="file">` + hidden-input + `value=''` reset | First file-picker usage | RESEARCH.md Pattern 5 (lines 401-424) + Pitfall 6 |
| Audio duration extraction with Infinity fallback | First metadata extraction | RESEARCH.md Pattern 2 (lines 297-334) |
| `crypto.randomUUID()` | First UUID usage | RESEARCH.md "Don't Hand-Roll" (line 444) |
| `cancelled` flag for async hydration in `useEffect` | All current hydrations are sync (localStorage) | Standard React idiom; planner should document as a new convention |
| Inline-row delete-confirmation (state-swap, not modal) | First inline-confirmation UX | UI-SPEC §"Delete Confirmation — Inline, Not Modal" (lines 248-267) |
| Player view-state branching (`view: 'library' \| 'playing'`) inside a panel | BreathingScreen toggles via `visible` props, doesn't render-switch sub-components | UI-SPEC §"Component Hierarchy" (lines 405-421) |

For each, the planner's plan files should cite RESEARCH.md / UI-SPEC line ranges directly rather than pointing at an in-repo analog.

## Metadata

**Analog search scope:**
- `src/hooks/` — all 5 files read (useBreathingAudio, useWakeLock, useSettings, useSessionTimer, useBreathingAnimation indirectly via BreathingScreen)
- `src/components/` — all 10 files; deeply read 6 (MeditationScreen, BreathingScreen, MusicToggle, VoiceToggle, CountdownDisplay, TimingControls, PageDots, SwipeContainer, App)
- `src/types/` — `breathing.ts`
- `src/__tests__/` — 4 files deeply read (navigation, breathing-audio, wake-lock, breathing-screen, settings-persistence, session-timer)

**Files scanned:** 22 source/test files; 13 deeply read for code excerpts.

**Pattern extraction date:** 2026-06-10

**Repo conventions confirmed:**
- Tests live in `src/__tests__/` (not `tests/`).
- No state-management library — `useReducer` for breathing, `useState` for meditation per RESEARCH.md.
- All UI is hand-built Tailwind utilities; no design-system blocks (UI-SPEC line 426).
- Howler is the only audio library; all Howl instances use `html5: true`.
- All panel containers share the `data-panel="..." aria-label="..." w-screen h-dvh flex-shrink-0 snap-start snap-always bg-[#5f7d60]` chain.
- All time strings use `tabular-nums`.
- All interactive controls have `aria-label` + `active:` state class; no hover states (mobile-first).
