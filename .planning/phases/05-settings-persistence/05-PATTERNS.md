# Phase 5: Settings & Persistence - Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 7 (new/modified)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/breathing.ts` | model | config | self (extend existing) | exact |
| `src/components/TimingControls.tsx` | component | request-response | self (add duration Stepper) | exact |
| `src/components/CountdownDisplay.tsx` | component | transform | `src/components/MusicToggle.tsx` | role-match |
| `src/components/BreathingScreen.tsx` | component | request-response | self (integration hub) | exact |
| `src/hooks/useBreathingAnimation.ts` | hook | event-driven | self (extend reducer) | exact |
| `src/hooks/useSessionTimer.ts` | hook | event-driven | `src/hooks/useWakeLock.ts` | role-match |
| `src/hooks/useSettings.ts` | hook | CRUD | `src/hooks/useWakeLock.ts` | role-match |

## Pattern Assignments

### `src/types/breathing.ts` (model, config) -- MODIFY

**Analog:** self

**Existing type pattern** (lines 3-7):
```typescript
export interface BreathingConfig {
  inhale: number; // seconds (min: 1, max: 60)
  hold: number;   // seconds (min: 0, max: 60) -- 0 means skip hold phase
  exhale: number; // seconds (min: 1, max: 60)
}
```
**Extend with:** `duration: number; // minutes (min: 0, max: 60) -- 0 means infinite`

**Existing state interface** (lines 9-13):
```typescript
export interface BreathingState {
  session: SessionState;
  config: BreathingConfig;
  musicEnabled: boolean;
}
```

**Existing action union** (lines 15-21):
```typescript
export type BreathingAction =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'SET_INHALE'; value: number }
  | { type: 'SET_HOLD'; value: number }
  | { type: 'SET_EXHALE'; value: number }
  | { type: 'TOGGLE_MUSIC' };
```
**Extend with:** `| { type: 'SET_DURATION'; value: number }`

**Existing constants pattern** (lines 23-30):
```typescript
export const DEFAULT_CONFIG: BreathingConfig = {
  inhale: 5,
  hold: 5,
  exhale: 5,
};

export const MIN_SECONDS = { inhale: 1, hold: 0, exhale: 1 };
export const MAX_SECONDS = { inhale: 60, hold: 60, exhale: 60 };
```
**Extend with:** Add `duration` to DEFAULT_CONFIG and add MIN/MAX for duration (0/60 minutes).

---

### `src/components/TimingControls.tsx` (component, request-response) -- MODIFY

**Analog:** self

**Stepper component pattern** (lines 4-37) -- reuse directly for duration:
```typescript
interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function Stepper({ label, value, min, max, onChange }: StepperProps) {
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
          -
        </button>
        <span className="text-white text-lg w-6 text-center tabular-nums">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-white/30 text-white flex items-center justify-center disabled:opacity-30 active:bg-white/10"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
```

**Layout pattern** (lines 45-77) -- add duration Stepper below timing row:
```typescript
export function TimingControls({ config, dispatch, visible }: TimingControlsProps) {
  return (
    <div
      data-testid="timing-controls"
      className={`absolute top-[15%] left-0 right-0 px-4 flex justify-center gap-4 sm:gap-8 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      <Stepper ... />
      <Stepper ... />
      <Stepper ... />
    </div>
  );
}
```
**Note:** Duration stepper needs distinct placement "below" the timing row. Consider wrapping in flex-col with two rows, or a separate absolute-positioned container below.

---

### `src/components/CountdownDisplay.tsx` (component, transform) -- NEW

**Analog:** `src/components/MusicToggle.tsx` (simple presentational component with visibility/toggle pattern)

**Imports pattern** (from MusicToggle, line 1-4):
```typescript
interface MusicToggleProps {
  enabled: boolean;
  onToggle: () => void;
}
```
**Adapt to:**
```typescript
interface CountdownDisplayProps {
  remainingSeconds: number;
  visible: boolean;
}
```

**Positioning and visibility pattern** (MusicToggle, line 12):
```typescript
className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] right-8 w-10 h-10 flex items-center justify-center text-white/70 active:text-white transition-colors"
```
**Adapt to:** Position centered below the breathing circle, use similar `absolute` positioning + `transition-opacity` fade pattern from TimingControls:
```typescript
className={`absolute bottom-[30%] left-0 right-0 text-center text-white/60 text-sm tabular-nums transition-opacity duration-500 ${
  visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
}`}
```

**Visibility fade pattern** (from TimingControls, lines 49-51):
```typescript
className={`... transition-opacity duration-500 ${
  visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
}`}
aria-hidden={!visible}
```

---

### `src/components/BreathingScreen.tsx` (component, request-response) -- MODIFY

**Analog:** self

**State initialization pattern** (lines 10-15):
```typescript
const initialState: BreathingState = {
  session: 'idle',
  config: { ...DEFAULT_CONFIG },
  musicEnabled: true,
};
```
**Adapt:** Replace hardcoded `DEFAULT_CONFIG` with persisted settings loaded from `useSettings` hook.

**Start/stop integration pattern** (lines 23-35):
```typescript
const handleCircleTap = () => {
  if (state.session === 'idle') {
    dispatch({ type: 'START' });
    start(state.config);
    audioStart(state.config);
    wakeLockActivate();
  } else {
    dispatch({ type: 'STOP' });
    stop();
    audioStop();
    wakeLockRelease();
  }
};
```
**Extend:** Add timer start on START (when duration > 0), timer clear on STOP. Auto-stop callback from timer triggers the same STOP sequence.

**Component composition pattern** (lines 43-65):
```typescript
return (
  <div data-panel="breathing" ... className="...relative">
    <TimingControls config={...} dispatch={...} visible={...} />
    <BreathingCircle ref={...} session={...} onClick={...} />
    <MusicToggle enabled={...} onToggle={...} />
  </div>
);
```
**Extend:** Add `<CountdownDisplay remainingSeconds={...} visible={state.session === 'running' && config.duration > 0} />` between BreathingCircle and MusicToggle.

---

### `src/hooks/useBreathingAnimation.ts` -- reducer extension (hook, event-driven) -- MODIFY

**Analog:** self

**Reducer case pattern** (lines 14-28) -- SET_INHALE/SET_HOLD/SET_EXHALE all follow identical structure:
```typescript
case 'SET_INHALE': {
  if (state.session === 'running') return state;
  const value = Math.max(MIN_SECONDS.inhale, Math.min(MAX_SECONDS.inhale, action.value));
  return { ...state, config: { ...state.config, inhale: value } };
}
```
**Copy exactly for SET_DURATION:**
```typescript
case 'SET_DURATION': {
  if (state.session === 'running') return state;
  const value = Math.max(MIN_DURATION, Math.min(MAX_DURATION, action.value));
  return { ...state, config: { ...state.config, duration: value } };
}
```

---

### `src/hooks/useSessionTimer.ts` (hook, event-driven) -- NEW

**Analog:** `src/hooks/useWakeLock.ts` (hook with activate/release lifecycle, ref-based state, cleanup on unmount)

**Hook structure pattern** (useWakeLock, lines 1-55):
```typescript
import { useRef, useCallback, useEffect } from 'react';

export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const activeRef = useRef(false);

  const activate = useCallback(async () => {
    activeRef.current = true;
    await request();
  }, [request]);

  const release = useCallback(async () => {
    activeRef.current = false;
    // cleanup logic
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { /* cleanup */ };
  }, []);

  return { activate, release };
}
```
**Adapt to session timer:**
```typescript
import { useRef, useCallback, useEffect } from 'react';

export function useSessionTimer(onComplete: () => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(0);
  const [remaining, setRemaining] = useState(0);

  const start = useCallback((durationMinutes: number) => {
    remainingRef.current = durationMinutes * 60;
    setRemaining(remainingRef.current);
    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);
      if (remainingRef.current <= 0) {
        clear();
        onComplete();
      }
    }, 1000);
  }, [onComplete]);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    remainingRef.current = 0;
    setRemaining(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return { remaining, start, clear };
}
```

---

### `src/hooks/useSettings.ts` (hook, CRUD/localStorage) -- NEW

**Analog:** `src/hooks/useWakeLock.ts` (hook with ref-based state, side-effect lifecycle)

**Hook export pattern** (useWakeLock structure):
```typescript
import { useRef, useCallback, useEffect } from 'react';

export function useWakeLock() {
  // refs for state
  // callbacks for actions
  // effects for lifecycle
  return { activate, release };
}
```
**Adapt for localStorage persistence:**
```typescript
import { useCallback } from 'react';
import type { BreathingConfig } from '../types/breathing';
import { DEFAULT_CONFIG } from '../types/breathing';

const STORAGE_KEY = 'mindfulone-settings';

interface PersistedSettings {
  config: BreathingConfig; // includes duration
  musicEnabled: boolean;
}

export function loadSettings(): { config: BreathingConfig; musicEnabled: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { config: { ...DEFAULT_CONFIG }, musicEnabled: true };
    const parsed = JSON.parse(raw) as PersistedSettings;
    return { config: { ...DEFAULT_CONFIG, ...parsed.config }, musicEnabled: parsed.musicEnabled ?? true };
  } catch {
    return { config: { ...DEFAULT_CONFIG }, musicEnabled: true };
  }
}

export function saveSettings(config: BreathingConfig, musicEnabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, musicEnabled }));
  } catch {
    // localStorage full or unavailable -- silently ignore
  }
}
```

---

## Shared Patterns

### Visibility Fade (controls show/hide)
**Source:** `src/components/TimingControls.tsx` lines 49-53
**Apply to:** TimingControls (existing), CountdownDisplay (new)
```typescript
className={`... transition-opacity duration-500 ${
  visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
}`}
aria-hidden={!visible}
```

### Reducer Case Structure (config setters)
**Source:** `src/hooks/useBreathingAnimation.ts` lines 14-28
**Apply to:** New SET_DURATION action
```typescript
case 'SET_SOMETHING': {
  if (state.session === 'running') return state;
  const value = Math.max(MIN, Math.min(MAX, action.value));
  return { ...state, config: { ...state.config, field: value } };
}
```

### Hook Lifecycle (activate/release with cleanup)
**Source:** `src/hooks/useWakeLock.ts` lines 1-55
**Apply to:** useSessionTimer (new), useSettings (new)
```typescript
import { useRef, useCallback, useEffect } from 'react';

export function useHookName() {
  const someRef = useRef<Type | null>(null);

  const activate = useCallback(() => { /* start logic */ }, []);
  const release = useCallback(() => { /* cleanup logic */ }, []);

  useEffect(() => {
    return () => { /* unmount cleanup */ };
  }, []);

  return { activate, release };
}
```

### Test Structure (reducer tests)
**Source:** `src/__tests__/breathing-state.test.ts` lines 1-10
**Apply to:** New SET_DURATION test cases, persistence tests
```typescript
import { describe, it, expect } from 'vitest';
import { breathingReducer } from '../hooks/useBreathingAnimation';
import { DEFAULT_CONFIG } from '../types/breathing';
import type { BreathingState } from '../types/breathing';

const initialState: BreathingState = {
  session: 'idle',
  config: { ...DEFAULT_CONFIG },
  musicEnabled: true,
};
```

### Integration Test Pattern (screen interactions)
**Source:** `src/__tests__/breathing-screen.test.tsx` lines 1-12
**Apply to:** Countdown display tests, timer auto-stop tests
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

### Component Props Interface
**Source:** `src/components/MusicToggle.tsx` lines 1-4
**Apply to:** CountdownDisplay (new)
```typescript
interface ComponentNameProps {
  propertyA: type;
  propertyB: type;
}

export function ComponentName({ propertyA, propertyB }: ComponentNameProps) {
  // ...
}
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | -- | -- | All files have strong analogs in the existing codebase |

## Metadata

**Analog search scope:** `src/` (components, hooks, types, __tests__)
**Files scanned:** 22
**Pattern extraction date:** 2026-05-10
