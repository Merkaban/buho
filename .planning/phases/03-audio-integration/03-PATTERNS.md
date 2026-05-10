# Phase 3: Audio Integration - Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 7 (4 new, 3 modified)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/hooks/useBreathingAudio.ts` | hook | event-driven | `src/hooks/useBreathingAnimation.ts` | exact |
| `src/components/MusicToggle.tsx` | component | request-response | `src/components/BreathingCircle.tsx` | role-match |
| `src/components/BreathingScreen.tsx` (mod) | component | request-response | itself (current state) | exact |
| `src/types/breathing.ts` (mod) | model | n/a | itself (current state) | exact |
| `vite.config.ts` (mod) | config | n/a | itself (current state) | exact |
| `src/__tests__/breathing-audio.test.ts` | test | n/a | `src/__tests__/breathing-screen.test.tsx` | role-match |
| `public/audio/*.mp3` (4 files) | asset | n/a | `public/*.png` | partial |

## Pattern Assignments

### `src/hooks/useBreathingAudio.ts` (hook, event-driven)

**Analog:** `src/hooks/useBreathingAnimation.ts`

**Imports pattern** (lines 1-3):
```typescript
import { useRef, useCallback, useEffect } from 'react';
import type { BreathingState, BreathingAction, BreathingConfig } from '../types/breathing';
import { MIN_SECONDS, MAX_SECONDS } from '../types/breathing';
```

**Hook structure pattern** (lines 35-109):
```typescript
// Named export function (not default export)
export function useBreathingAnimation() {
  // Refs for mutable state that doesn't trigger re-renders
  const animationRef = useRef<Animation | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const configRef = useRef<BreathingConfig | null>(null);
  const runningRef = useRef(false);

  // Internal helper wrapped in useCallback (no deps that change)
  const startCycle = useCallback(() => {
    // ...cycle logic using refs...
  }, []);

  // Public start method: sets refs, calls internal helper
  const start = useCallback((config: BreathingConfig) => {
    configRef.current = config;
    runningRef.current = true;
    startCycle();
  }, [startCycle]);

  // Public stop method: clears refs and cancels operations
  const stop = useCallback(() => {
    runningRef.current = false;
    // ...cleanup...
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
      // ...cleanup...
    };
  }, []);

  // Return object with public API
  return { elementRef, start, stop };
}
```

**Key conventions to follow:**
- `runningRef.current` guards all callback execution (lines 43, 80, 99)
- `useCallback` with stable deps for all returned functions
- Cleanup effect at bottom that mirrors `stop()` logic
- Named export (not default)
- `configRef` pattern for accessing latest config without re-renders

---

### `src/components/MusicToggle.tsx` (component, request-response)

**Analog:** `src/components/BreathingCircle.tsx`

**Imports pattern** (lines 1-2):
```typescript
import { forwardRef } from 'react';
import type { SessionState } from '../types/breathing';
```

**Component interface pattern** (lines 4-7):
```typescript
interface BreathingCircleProps {
  session: SessionState;
  onClick: () => void;
}
```

**Button/interactive element pattern** (lines 9-31):
```typescript
// Named export, function component (not arrow)
export const BreathingCircle = forwardRef<HTMLDivElement, BreathingCircleProps>(
  function BreathingCircle({ session, onClick }, ref) {
    return (
      <div
        role="button"
        aria-label={isIdle ? 'Start breathing session' : 'Stop breathing session'}
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        className={`... cursor-pointer ...`}
      />
    );
  }
);
```

**Key conventions for MusicToggle:**
- Props interface defined above component
- `aria-label` for accessibility with dynamic state text
- `role="button"` on non-button elements (or use `<button>` directly since MusicToggle is simpler)
- Tailwind classes for styling (utility-first)
- Conditional class application based on state

**Positioning analog** from `TimingControls.tsx` (lines 47-53):
```typescript
// Absolute positioning within the parent container
<div
  data-testid="timing-controls"
  className={`absolute top-[15%] left-0 right-0 flex justify-center gap-8 transition-opacity duration-500 ${
    visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`}
  aria-hidden={!visible}
>
```

**Key difference for MusicToggle:** Per D-02, the toggle does NOT fade out when session starts. It stays always visible. So no visibility/opacity toggling needed -- just absolute positioning in the bottom corner.

---

### `src/components/BreathingScreen.tsx` (modification)

**Analog:** Itself (current file)

**Current orchestration pattern** (lines 13-25):
```typescript
export function BreathingScreen() {
  const [state, dispatch] = useReducer(breathingReducer, initialState);
  const { elementRef, start, stop } = useBreathingAnimation();

  const handleCircleTap = () => {
    if (state.session === 'idle') {
      dispatch({ type: 'START' });
      start(state.config);
    } else {
      dispatch({ type: 'STOP' });
      stop();
    }
  };
  // ...
}
```

**Integration pattern to follow:**
- New hook (`useBreathingAudio`) destructures alongside existing hook (line 15)
- Audio `start`/`stop` called in the same `handleCircleTap` handler alongside animation start/stop
- Music toggle dispatch added to handler (or separate handler for TOGGLE_MUSIC)
- MusicToggle component rendered OUTSIDE the fading TimingControls area (per D-02)

**Layout pattern** (lines 27-45):
```typescript
return (
  <div
    data-panel="breathing"
    data-session={state.session}
    aria-label="Breathing"
    className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex items-center justify-center bg-[#5f7d60] relative"
  >
    <TimingControls ... />
    <BreathingCircle ... />
    {/* MusicToggle goes here -- sibling of TimingControls and BreathingCircle */}
  </div>
);
```

---

### `src/types/breathing.ts` (modification)

**Analog:** Itself (current file)

**Type extension pattern** (lines 9-19):
```typescript
export interface BreathingState {
  session: SessionState;
  config: BreathingConfig;
  // Add: musicEnabled: boolean;
}

export type BreathingAction =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'SET_INHALE'; value: number }
  | { type: 'SET_HOLD'; value: number }
  | { type: 'SET_EXHALE'; value: number };
  // Add: | { type: 'TOGGLE_MUSIC' }
```

**Convention:** Union type actions with `type` discriminator. Simple actions have no payload. Value actions use `value: number`.

---

### `vite.config.ts` (modification)

**Analog:** Itself (current file)

**Workbox config pattern** (lines 41-44):
```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  cleanupOutdatedCaches: true,
},
```

**Change needed:** Add `mp3` to the globPatterns string: `'**/*.{js,css,html,ico,png,svg,woff2,mp3}'`

---

### `src/__tests__/breathing-audio.test.ts` (test, new)

**Analog:** `src/__tests__/breathing-screen.test.tsx` + `src/__tests__/breathing-state.test.ts`

**Test file structure pattern** from `breathing-screen.test.tsx` (lines 1-6):
```typescript
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { BreathingScreen } from '../components/BreathingScreen';

// Mock external API that jsdom doesn't implement
beforeAll(() => {
  Element.prototype.animate = vi.fn().mockReturnValue({
    onfinish: null,
    cancel: vi.fn(),
    finished: Promise.resolve(),
  });
});
```

**Describe/it naming convention** (lines 14, 21, 29):
```typescript
describe('Breathing Screen Interaction (BRTH-04, BRTH-05)', () => {
  it('renders breathing circle at resting size (D-11)', () => { ... });
  it('tapping circle starts a session (D-09, BRTH-04)', () => { ... });
});
```

**Key test conventions:**
- Requirement IDs in describe block: `(BRTH-09, BRTH-10, BRTH-11, BRTH-12)`
- Decision IDs in it blocks: `(D-04)`, `(D-10)`
- `beforeAll` for mocking external APIs not available in jsdom
- `vi.fn()` for mock functions
- `vi.mock()` for module-level mocking (needed for howler)

**Reducer testing pattern** from `breathing-state.test.ts` (lines 1-9):
```typescript
import { describe, it, expect } from 'vitest';
import { breathingReducer } from '../hooks/useBreathingAnimation';
import { DEFAULT_CONFIG } from '../types/breathing';
import type { BreathingState } from '../types/breathing';

const initialState: BreathingState = {
  session: 'idle',
  config: { ...DEFAULT_CONFIG },
};
```

**Convention:** Test the reducer (TOGGLE_MUSIC action) directly with pure function calls + `expect`.

---

## Shared Patterns

### State Management (Reducer + Dispatch)
**Source:** `src/hooks/useBreathingAnimation.ts` lines 6-32
**Apply to:** `BreathingScreen.tsx`, `types/breathing.ts`, `breathing-audio.test.ts`

```typescript
export function breathingReducer(state: BreathingState, action: BreathingAction): BreathingState {
  switch (action.type) {
    case 'START':
      if (state.session === 'running') return state;
      return { ...state, session: 'running' };
    case 'STOP':
      if (state.session === 'idle') return state;
      return { ...state, session: 'idle' };
    // ...
    default:
      return state;
  }
}
```

**Convention:** Guard clauses return `state` unchanged for no-op cases. Immutable updates with spread.

### Ref-based Mutable State (No Re-renders)
**Source:** `src/hooks/useBreathingAnimation.ts` lines 36-39
**Apply to:** `useBreathingAudio.ts`

```typescript
const animationRef = useRef<Animation | null>(null);
const elementRef = useRef<HTMLDivElement | null>(null);
const configRef = useRef<BreathingConfig | null>(null);
const runningRef = useRef(false);
```

**Convention:** Audio hook should use refs for all mutable state (Howl instances, timer IDs, running flag, music-enabled flag) to avoid re-renders during playback.

### Tailwind Styling
**Source:** All components
**Apply to:** `MusicToggle.tsx`

```typescript
// Interactive element styling conventions:
className="w-8 h-8 rounded-full border border-white/30 text-white flex items-center justify-center disabled:opacity-30 active:bg-white/10"
// Opacity for secondary text:
className="text-white/60 text-xs uppercase tracking-wider"
// Layout with absolute positioning:
className="absolute bottom-8 right-8 ..."
```

**Conventions:**
- White text with opacity (e.g. `text-white/70`) for secondary UI elements
- `active:` prefix for touch feedback on buttons
- `transition-*` classes for smooth state changes
- `absolute` positioning within `relative` parent container

### Component Export Style
**Source:** All components
**Apply to:** `MusicToggle.tsx`

```typescript
// Named export, function declaration (not arrow, not default)
export function TimingControls({ config, dispatch, visible }: TimingControlsProps) {
```

Or for forwardRef:
```typescript
export const BreathingCircle = forwardRef<HTMLDivElement, BreathingCircleProps>(
  function BreathingCircle({ session, onClick }, ref) {
```

**Convention:** Named exports throughout. Props interface defined directly above component.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `public/audio/breathe-in.mp3` | asset | n/a | No audio assets exist yet -- generated via macOS `say` + `ffmpeg` |
| `public/audio/hold.mp3` | asset | n/a | Same -- generated placeholder |
| `public/audio/breathe-out.mp3` | asset | n/a | Same -- generated placeholder |
| `public/audio/ocean-waves.mp3` | asset | n/a | Same -- sourced royalty-free or generated |

These are binary assets generated via CLI commands (see RESEARCH.md Pattern 4). No code analog needed.

## Metadata

**Analog search scope:** `src/`, `public/`, root config files
**Files scanned:** 18 source files + 4 public assets
**Pattern extraction date:** 2026-05-10
