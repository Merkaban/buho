# Phase 2: Breathing Timer & Animation - Research

**Researched:** 2026-05-10
**Domain:** CSS animation, React state management, requestAnimationFrame timing
**Confidence:** HIGH

## Summary

This phase implements the core breathing circle animation with configurable inhale/hold/exhale timing and tap-to-start/stop interaction. The primary technical challenge is achieving smooth 60fps animation that loops indefinitely without timing drift, using dynamically configurable phase durations.

The recommended approach uses the **Web Animations API** (`Element.animate()`) with dynamically computed keyframe offsets. This gives GPU-accelerated `transform: scale()` animation with precise timing control, programmatic play/pause, and clean React integration via refs. The animation is re-created each cycle (or on config change) with computed offsets based on the ratio of inhale/hold/exhale to total cycle duration.

**Primary recommendation:** Use Web Animations API with `transform: scale()` for the breathing circle, React `useReducer` for session state machine, and `useRef` for animation instance management. Avoid CSS `@keyframes` (cannot dynamically change individual phase durations) and avoid raw `requestAnimationFrame` loops (unnecessary complexity when Web Animations API handles timing natively).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Circle scales from 48px (min/resting) to 220px (max/fully inhaled) -- ~4.5x expansion ratio
- **D-02:** Inhale: smooth scale from min to max over configured duration
- **D-03:** Hold: circle stays at max size for configured duration
- **D-04:** Exhale: smooth scale from max to min over configured duration
- **D-05:** Animation must be 60fps smooth (CSS animation or requestAnimationFrame)
- **D-06:** Default timing: 5s inhale / 5s hold / 5s exhale
- **D-07:** Hold can be set to 0 (skips hold phase entirely)
- **D-08:** Session runs indefinitely (repeating cycles) until user taps stop
- **D-09:** Tap the circle to start a session
- **D-10:** Tap the circle again to stop a session
- **D-11:** Resting state: circle at minimum size (48px) with a subtle glow -- should "read" like an invitation to tap
- **D-12:** During session: circle animates, no glow effect (clean breathing visual)
- **D-13:** Controls positioned above the circle (upper third of screen)
- **D-14:** Circle stays vertically centered at all times
- **D-15:** Controls visible in resting mode, fade out when session starts
- **D-16:** Controls are steppers (+/- buttons) for inhale, hold, and exhale seconds
- **D-17:** When controls fade out on start, nothing shifts -- layout is stable

### Claude's Discretion
- Animation implementation approach (Web Animations API vs CSS vs rAF)
- State management pattern (useState vs useReducer)
- Component decomposition within BreathingScreen
- Stepper control design details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRTH-01 | User can configure inhale duration in seconds | Stepper control pattern, React state management |
| BRTH-02 | User can configure hold duration in seconds | Stepper control pattern, hold=0 skip logic |
| BRTH-03 | User can configure exhale duration in seconds | Stepper control pattern, React state management |
| BRTH-04 | User can start a breathing session with a single tap | Tap-to-start on circle, session state machine |
| BRTH-05 | User can stop a breathing session with a single tap | Tap-to-stop on circle, animation cancellation |
| BRTH-06 | White circle grows during inhale phase | Web Animations API scale transform, ease-in-out timing |
| BRTH-07 | White circle stays large during hold phase | Keyframe offset holds scale at max during hold |
| BRTH-08 | White circle shrinks during exhale phase | Web Animations API scale transform, ease-in-out timing |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Breathing animation rendering | Browser / Client | -- | Pure CSS transform compositing, GPU-accelerated |
| Timer state management | Browser / Client | -- | Local React state, no server involvement |
| Configuration (inhale/hold/exhale) | Browser / Client | -- | In-memory state, persistence deferred to Phase 5 |
| Start/stop interaction | Browser / Client | -- | DOM event handling on the circle element |
| Controls UI (steppers) | Browser / Client | -- | React components with Tailwind styling |

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.6 | Component model, state management, refs | Already installed, component model fits UI [VERIFIED: node_modules] |
| Vite | 8.0.11 | Build tooling, HMR for development | Already installed [VERIFIED: node_modules] |
| Tailwind CSS | 4.3.0 | Utility styling for controls, layout | Already installed, established pattern [VERIFIED: node_modules] |
| Vitest | 4.1.5 | Unit testing timer logic and state | Already installed [VERIFIED: node_modules] |
| @testing-library/react | 16.3.2 | Component render testing | Already installed [VERIFIED: node_modules] |

### Supporting (No Additional Dependencies)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Web Animations API | Browser native | GPU-accelerated animation with JS control | The breathing circle animation [VERIFIED: MDN docs] |
| requestAnimationFrame | Browser native | Fallback or progress tracking | Only if Web Animations API proves insufficient [VERIFIED: MDN docs] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Web Animations API | CSS @keyframes | Cannot dynamically change phase durations without regenerating stylesheet |
| Web Animations API | requestAnimationFrame loop | More code, manual frame scheduling, manual easing math |
| useReducer | useState + multiple setState | Reducer centralizes state transitions, prevents invalid states |

**Installation:**
```bash
# No new packages needed -- all capabilities are browser-native or already installed
```

## Architecture Patterns

### System Architecture Diagram

```
User Tap (circle)
    |
    v
[Session State Machine]  <-- useReducer (idle/running/stopping)
    |
    |-- START --> create Animation instance via Web Animations API
    |             |
    |             v
    |         [Animation Loop]
    |             |-- Keyframes: scale(0.218) -> scale(1) -> scale(1) -> scale(0.218)
    |             |-- Offsets: [0, inhaleRatio, inhaleRatio+holdRatio, 1]
    |             |-- Timing: { duration: totalMs, easing per-keyframe }
    |             |-- onfinish -> restart animation (infinite loop via recursion)
    |             |
    |-- STOP --> animation.cancel() --> reset circle to 48px
    |
    v
[Controls Component] <-- Stepper inputs for inhale/hold/exhale seconds
    |-- Visible when idle (opacity transition)
    |-- Hidden when running (opacity: 0, pointer-events: none)
    |-- Updates timing config (takes effect on next cycle)
```

### Recommended Project Structure
```
src/
├── components/
│   ├── BreathingScreen.tsx      # Main container, state machine, orchestration
│   ├── BreathingCircle.tsx      # Circle element + animation logic (imperative via ref)
│   └── TimingControls.tsx       # Stepper controls for inhale/hold/exhale
├── hooks/
│   └── useBreathingAnimation.ts # Web Animations API logic, encapsulated
├── types/
│   └── breathing.ts             # BreathingConfig, SessionState types
└── __tests__/
    ├── breathing-state.test.ts  # State machine transitions
    └── breathing-screen.test.tsx # Integration: render + interaction
```

### Pattern 1: Web Animations API with Dynamic Offsets
**What:** Compute keyframe offsets from configurable phase durations, create one animation per cycle
**When to use:** Every breathing cycle start/restart
**Example:**
```typescript
// Source: MDN Web Animations API + computed offsets pattern
interface BreathingConfig {
  inhaleMs: number;
  holdMs: number;
  exhaleMs: number;
}

function createBreathingAnimation(
  element: HTMLElement,
  config: BreathingConfig
): Animation {
  const totalMs = config.inhaleMs + config.holdMs + config.exhaleMs;
  const inhaleEnd = config.inhaleMs / totalMs;
  const holdEnd = inhaleEnd + config.holdMs / totalMs;

  // Scale factor: 48px base, 220px max = 220/48 = 4.583
  const minScale = 1;       // 48px is the element's natural size
  const maxScale = 220 / 48; // ~4.583

  const keyframes: Keyframe[] = [
    { transform: `scale(${minScale})`, offset: 0, easing: 'ease-in-out' },
    { transform: `scale(${maxScale})`, offset: inhaleEnd, easing: 'linear' },
    { transform: `scale(${maxScale})`, offset: holdEnd, easing: 'ease-in-out' },
    { transform: `scale(${minScale})`, offset: 1 },
  ];

  // If hold is 0, skip the hold keyframe
  const filtered = config.holdMs === 0
    ? keyframes.filter((_, i) => i !== 2)
    : keyframes;

  return element.animate(filtered, {
    duration: totalMs,
    iterations: 1,  // We restart manually for config-change responsiveness
    fill: 'forwards',
  });
}
```

### Pattern 2: Session State Machine with useReducer
**What:** Centralized state transitions prevent impossible states (e.g., starting while already running)
**When to use:** Managing session lifecycle
**Example:**
```typescript
// Source: React docs useReducer pattern
type SessionState = 'idle' | 'running';

interface BreathingState {
  session: SessionState;
  config: {
    inhale: number; // seconds
    hold: number;   // seconds
    exhale: number; // seconds
  };
}

type BreathingAction =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'SET_INHALE'; value: number }
  | { type: 'SET_HOLD'; value: number }
  | { type: 'SET_EXHALE'; value: number };

function breathingReducer(state: BreathingState, action: BreathingAction): BreathingState {
  switch (action.type) {
    case 'START':
      if (state.session === 'running') return state;
      return { ...state, session: 'running' };
    case 'STOP':
      if (state.session === 'idle') return state;
      return { ...state, session: 'idle' };
    case 'SET_INHALE':
      if (state.session === 'running') return state; // ignore during session
      return { ...state, config: { ...state.config, inhale: action.value } };
    case 'SET_HOLD':
      if (state.session === 'running') return state;
      return { ...state, config: { ...state.config, hold: action.value } };
    case 'SET_EXHALE':
      if (state.session === 'running') return state;
      return { ...state, config: { ...state.config, exhale: action.value } };
    default:
      return state;
  }
}
```

### Pattern 3: Stable Layout with Opacity Fade for Controls
**What:** Controls use `opacity` + `pointer-events` to fade without causing layout shift
**When to use:** D-15 and D-17 -- controls fade out when session starts, nothing shifts
**Example:**
```typescript
// Source: Tailwind utility pattern for visibility without layout shift
<div className={`transition-opacity duration-500 ${
  session === 'running'
    ? 'opacity-0 pointer-events-none'
    : 'opacity-100'
}`}>
  {/* Stepper controls */}
</div>
```

### Pattern 4: Animation Loop via onfinish Recursion
**What:** Instead of `iterations: Infinity`, restart animation on finish for config-change responsiveness
**When to use:** Looping animation that can pick up new durations between cycles
**Example:**
```typescript
// Source: MDN Web Animations API onfinish pattern
function startLoop(element: HTMLElement, configRef: React.RefObject<BreathingConfig>) {
  const anim = createBreathingAnimation(element, configRef.current);

  anim.onfinish = () => {
    // Re-read config -- allows mid-session duration changes to take effect
    startLoop(element, configRef);
  };

  return anim;
}
```

### Anti-Patterns to Avoid
- **Animating width/height instead of transform:** Triggers layout reflow every frame, kills 60fps. Always use `transform: scale()` which only triggers compositing. [VERIFIED: MDN transform docs]
- **CSS @keyframes with fixed percentages:** Cannot dynamically recalculate phase durations without injecting style elements. Web Animations API solves this natively.
- **setInterval for animation timing:** Imprecise, subject to drift, not synced to display refresh. requestAnimationFrame or Web Animations API are the correct tools.
- **Storing animation instance in React state:** Animation objects are mutable/imperative. Store in `useRef`, not `useState`, to avoid unnecessary re-renders.
- **iterations: Infinity with Web Animations API:** Prevents picking up config changes between cycles. Use manual restart on `onfinish` instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth GPU animation | Manual rAF loop with easing math | Web Animations API `Element.animate()` | Handles GPU compositing, easing, timing natively [VERIFIED: MDN] |
| Easing curves | Custom cubic-bezier math | `easing: 'ease-in-out'` in keyframe options | Browser-native, hardware-optimized [VERIFIED: MDN] |
| Animation cancellation/cleanup | Manual state flags and cancelAnimationFrame | `animation.cancel()` | Clean API, handles all edge cases [VERIFIED: MDN] |
| Timer drift prevention | Custom drift-correction algorithm | Web Animations API internal clock | Uses browser's high-resolution timer, synced to display refresh [VERIFIED: MDN] |

**Key insight:** The Web Animations API was specifically designed to solve the problems of JS-driven animation timing. It runs on the browser's compositor thread, uses hardware-accelerated timing, and provides JavaScript control without the performance penalty of running animation logic in the main thread.

## Common Pitfalls

### Pitfall 1: Timing Drift in Long Sessions
**What goes wrong:** After 5+ minutes, animation phases visibly drift from their configured durations
**Why it happens:** Using setInterval/setTimeout for cycle management introduces cumulative error because JS timers are imprecise (4ms minimum resolution, throttled in background)
**How to avoid:** Use Web Animations API which runs on the browser's internal high-resolution clock, independent of main thread scheduling. Restart cycles via `onfinish` which fires at the precise end of the animation.
**Warning signs:** Circle scale visibly "jumps" or phases feel uneven after extended use

### Pitfall 2: Layout Shift When Controls Hide
**What goes wrong:** When controls fade out during session start, the circle jumps position
**Why it happens:** Using `display: none` or conditional rendering removes elements from flow, causing layout recalculation
**How to avoid:** Use `opacity: 0` + `pointer-events: none` (D-17 explicitly requires no shift). Keep controls in DOM at all times. Use absolute/fixed positioning for controls separate from circle centering.
**Warning signs:** Circle visibly moves vertically when tapping start

### Pitfall 3: Scale Transform Origin
**What goes wrong:** Circle scales from top-left corner instead of center
**Why it happens:** Default `transform-origin` is `50% 50%` (center), but if the element has unusual positioning it may appear off
**How to avoid:** Explicitly set `transform-origin: center` and use flexbox centering on the container. The circle's base size (48px) should be the element's natural dimensions.
**Warning signs:** Circle grows asymmetrically

### Pitfall 4: iOS Safari Web Animations API Support
**What goes wrong:** Animation doesn't work on older iOS versions
**Why it happens:** Web Animations API (`Element.animate()`) has been supported in Safari since version 13.1 (iOS 13.4, released March 2020). Any device running iOS 13.4+ supports it fully.
**How to avoid:** iOS 13.4+ covers all devices still receiving updates. No polyfill needed for this app's target audience. [ASSUMED -- based on caniuse training data]
**Warning signs:** Animation simply not appearing on test device

### Pitfall 5: Hold=0 Edge Case
**What goes wrong:** When hold is 0, having two adjacent keyframes at the same offset creates a jump
**Why it happens:** Two keyframes with offset values that are equal or nearly equal can cause interpolation artifacts
**How to avoid:** When hold=0, filter out the hold keyframe entirely so the animation goes directly from inhale-end to exhale-start. The exhale easing handles the smooth transition.
**Warning signs:** Brief "flash" or stutter at the peak of the circle when hold is set to 0

### Pitfall 6: Re-render During Animation
**What goes wrong:** React state change causes component re-render which unmounts/remounts the circle element, killing the animation
**Why it happens:** If the animated element's key changes or parent conditionally renders it
**How to avoid:** Keep the circle element always mounted. Store animation ref separately. Avoid React state changes during active session (config changes are blocked by the reducer).
**Warning signs:** Animation suddenly resets mid-cycle

## Code Examples

### Complete Breathing Animation Hook
```typescript
// Source: Synthesized from MDN Web Animations API + React patterns
import { useRef, useCallback } from 'react';

interface BreathingConfig {
  inhale: number; // seconds
  hold: number;   // seconds
  exhale: number; // seconds
}

export function useBreathingAnimation() {
  const animationRef = useRef<Animation | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const configRef = useRef<BreathingConfig>({ inhale: 5, hold: 5, exhale: 5 });

  const startCycle = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;

    const { inhale, hold, exhale } = configRef.current;
    const totalMs = (inhale + hold + exhale) * 1000;
    const inhaleEnd = inhale / (inhale + hold + exhale);
    const holdEnd = inhaleEnd + hold / (inhale + hold + exhale);

    const maxScale = 220 / 48; // ~4.583

    const keyframes: Keyframe[] = hold > 0
      ? [
          { transform: 'scale(1)', offset: 0, easing: 'ease-in-out' },
          { transform: `scale(${maxScale})`, offset: inhaleEnd, easing: 'linear' },
          { transform: `scale(${maxScale})`, offset: holdEnd, easing: 'ease-in-out' },
          { transform: 'scale(1)', offset: 1 },
        ]
      : [
          { transform: 'scale(1)', offset: 0, easing: 'ease-in-out' },
          { transform: `scale(${maxScale})`, offset: inhaleEnd, easing: 'ease-in-out' },
          { transform: 'scale(1)', offset: 1 },
        ];

    const anim = el.animate(keyframes, {
      duration: totalMs,
      iterations: 1,
      fill: 'forwards',
    });

    anim.onfinish = () => {
      startCycle(); // Loop by restarting
    };

    animationRef.current = anim;
  }, []);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
      animationRef.current = null;
    }
    // Reset scale to 1 (48px natural size)
    if (elementRef.current) {
      elementRef.current.style.transform = 'scale(1)';
    }
  }, []);

  return { elementRef, configRef, start: startCycle, stop };
}
```

### Stepper Control Component
```typescript
// Source: Standard React pattern for increment/decrement controls
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
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-white/30 text-white
                     flex items-center justify-center disabled:opacity-30"
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <span className="text-white text-lg w-6 text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-white/30 text-white
                     flex items-center justify-center disabled:opacity-30"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
```

### Resting Glow Effect
```typescript
// Source: Tailwind CSS box-shadow utility pattern
// Subtle glow that "invites" a tap -- per D-11
<div
  className={`w-12 h-12 rounded-full bg-white transition-shadow duration-300 ${
    isIdle ? 'shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'shadow-none'
  }`}
  style={{ transformOrigin: 'center' }}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery.animate() | Web Animations API | 2020+ (Safari 13.1) | Native browser API, no library needed |
| CSS @keyframes + class toggle | Element.animate() with JS | 2020+ | Dynamic durations without stylesheet manipulation |
| setInterval-based timing | rAF / WAAPI internal clock | 2015+ | Drift-free, synced to display refresh |
| width/height animation | transform: scale() | Long-standing best practice | Compositor-only, no layout reflow |

**Deprecated/outdated:**
- **Polyfilling Web Animations API**: No longer needed -- supported in all modern browsers including iOS Safari 13.4+ [ASSUMED]
- **vendor-prefixed transforms**: `-webkit-transform` unnecessary for target audience (iOS 13.4+) [ASSUMED]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Web Animations API supported in iOS Safari 13.4+ | Pitfall 4, State of the Art | Animation won't work on older iOS devices -- would need CSS @keyframes fallback |
| A2 | No vendor prefixes needed for transform/animate on target iOS versions | State of the Art | Minor -- easy to add if needed |

## Open Questions

1. **Scale approach: element base size vs transform**
   - What we know: D-01 specifies 48px min, 220px max. Using `transform: scale()` requires the element to be 48px naturally, then scale to 220/48 = 4.583x.
   - What's unclear: Whether a 4.58x scale factor causes any rendering artifacts on iOS (subpixel rendering, blurriness). Alternative: set element to 220px and scale down to 48/220 = 0.218.
   - Recommendation: Use 48px base with scale-up. CSS `will-change: transform` on the circle element promotes it to its own compositor layer, avoiding subpixel issues. Test on device during implementation.

2. **Config change during session**
   - What we know: D-16 steppers set durations. Reducer blocks changes while running.
   - What's unclear: Should tapping stop, changing config, then restarting feel seamless? Or do we need a "reset" transition?
   - Recommendation: On stop, immediately cancel animation and return to 48px (no transition needed -- circle just resets). Config changes take effect on next start.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build tooling | Yes | v25.8.2 | -- |
| Web Animations API | Circle animation | Yes (browser) | Native | CSS @keyframes (less dynamic) |
| React 19 | UI components | Yes | 19.2.6 | -- |
| Vitest | Testing | Yes | 4.1.5 | -- |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (jsdom environment, globals enabled) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRTH-01 | Configure inhale duration via stepper | unit | `npx vitest run src/__tests__/breathing-state.test.ts -t "inhale"` | No -- Wave 0 |
| BRTH-02 | Configure hold duration via stepper | unit | `npx vitest run src/__tests__/breathing-state.test.ts -t "hold"` | No -- Wave 0 |
| BRTH-03 | Configure exhale duration via stepper | unit | `npx vitest run src/__tests__/breathing-state.test.ts -t "exhale"` | No -- Wave 0 |
| BRTH-04 | Start session with single tap | integration | `npx vitest run src/__tests__/breathing-screen.test.tsx -t "start"` | No -- Wave 0 |
| BRTH-05 | Stop session with single tap | integration | `npx vitest run src/__tests__/breathing-screen.test.tsx -t "stop"` | No -- Wave 0 |
| BRTH-06 | Circle grows during inhale | manual-only | Visual verification on device | -- |
| BRTH-07 | Circle stays large during hold | manual-only | Visual verification on device | -- |
| BRTH-08 | Circle shrinks during exhale | manual-only | Visual verification on device | -- |

**Note on BRTH-06/07/08:** Web Animations API runs asynchronously in the compositor thread. jsdom does not implement `Element.animate()`, so visual animation behavior cannot be tested in unit tests. State transitions (that the animation is created with correct parameters) can be tested by mocking `Element.animate`.

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + visual device check

### Wave 0 Gaps
- [ ] `src/__tests__/breathing-state.test.ts` -- covers BRTH-01, BRTH-02, BRTH-03 (reducer logic)
- [ ] `src/__tests__/breathing-screen.test.tsx` -- covers BRTH-04, BRTH-05 (interaction)
- [ ] Mock for `Element.animate` in jsdom test environment

## Security Domain

This phase involves no authentication, data storage, network requests, or user input beyond numeric steppers bounded to min/max values. No ASVS categories apply.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | -- |
| V3 Session Management | No | -- |
| V4 Access Control | No | -- |
| V5 Input Validation | Minimal | Stepper min/max bounds in reducer |
| V6 Cryptography | No | -- |

No threat patterns apply to this phase -- it is purely client-side UI with no external data flow.

## Sources

### Primary (HIGH confidence)
- MDN Web Animations API -- Element.animate(), keyframes, timing, onfinish, cancel()
- MDN requestAnimationFrame -- timestamp-based timing, drift prevention
- MDN CSS transform -- scale() compositor-only behavior, no layout reflow
- MDN will-change -- GPU layer promotion for transform animations
- MDN animation-timing-function -- ease-in-out curve for natural breathing feel
- Context7 /websites/react_dev_reference -- useReducer, useEffect, useRef patterns
- Context7 /vitest-dev/vitest -- fake timers, advanceTimersByTime for state tests
- Node modules inspection -- verified React 19.2.6, Vite 8.0.11, Vitest 4.1.5, Tailwind 4.3.0

### Secondary (MEDIUM confidence)
- MDN Page Visibility API -- background tab behavior (relevant for Phase 4, noted here)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed, no new packages
- Architecture: HIGH -- Web Animations API is well-documented, pattern is straightforward
- Pitfalls: HIGH -- common issues well-documented in MDN and verified against requirements

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (stable browser APIs, no fast-moving dependencies)
