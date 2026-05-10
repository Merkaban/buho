# Phase 2: Breathing Timer & Animation - Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 7 (new/modified)
**Analogs found:** 5 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/BreathingScreen.tsx` | component | event-driven | `src/components/BreathingScreen.tsx` (current) | exact (modification) |
| `src/components/BreathingCircle.tsx` | component | event-driven | `src/components/PageDots.tsx` | role-match |
| `src/components/TimingControls.tsx` | component | request-response | `src/components/PageDots.tsx` | role-match |
| `src/hooks/useBreathingAnimation.ts` | hook | event-driven | `src/components/SwipeContainer.tsx` | partial (ref+callback pattern) |
| `src/types/breathing.ts` | type | N/A | None | -- |
| `src/__tests__/breathing-state.test.ts` | test | N/A | `src/__tests__/navigation.test.tsx` | exact |
| `src/__tests__/breathing-screen.test.tsx` | test | N/A | `src/__tests__/navigation.test.tsx` | exact |

## Pattern Assignments

### `src/components/BreathingScreen.tsx` (component, event-driven) -- MODIFY

**Analog:** Current `src/components/BreathingScreen.tsx` + `src/App.tsx`

This file will be significantly expanded from a static placeholder to the main orchestrator component containing session state, timer config, and child components.

**Current file structure** (`src/components/BreathingScreen.tsx`, lines 1-15):
```typescript
export function BreathingScreen() {
  return (
    <div
      data-panel="breathing"
      aria-label="Breathing"
      className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex items-center justify-center bg-black"
    >
      <div
        data-testid="breathing-circle"
        className="w-[120px] h-[120px] rounded-full bg-white"
        aria-label="Breathing circle"
      />
    </div>
  );
}
```

**Preserve these patterns:**
- `data-panel="breathing"` attribute (used by navigation tests)
- `data-testid="breathing-circle"` attribute (used by existing test)
- Outer div class pattern: `w-screen h-dvh flex-shrink-0 snap-start snap-always ... bg-black`
- Named export function (not default export)

**Import pattern** (from `src/App.tsx`, lines 1-5):
```typescript
import { useState } from 'react';
// Local component imports use relative paths, no barrel files
import { SwipeContainer } from './components/SwipeContainer';
import { PageDots } from './components/PageDots';
```

**State pattern** (from `src/App.tsx`, line 10):
```typescript
const [activePage, setActivePage] = useState(0);
```

---

### `src/components/BreathingCircle.tsx` (component, event-driven) -- NEW

**Analog:** `src/components/PageDots.tsx` (presentational component with props interface)

**Component structure pattern** (`src/components/PageDots.tsx`, lines 1-25):
```typescript
interface PageDotsProps {
  total: number;
  active: number;
}

export function PageDots({ total, active }: PageDotsProps) {
  return (
    <div
      role="group"
      aria-label="Navigation indicator"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* ... */}
    </div>
  );
}
```

**Key patterns to follow:**
- Props interface defined directly above the component (no separate file for single-use types)
- Named export function (not default)
- Destructured props in function signature
- Tailwind classes for all styling
- Conditional class application via template literals: `` `${condition ? 'class-a' : 'class-b'}` ``
- `aria-label` attributes for accessibility

**Conditional class pattern** (`src/components/PageDots.tsx`, lines 18-21):
```typescript
className={`w-2 h-2 rounded-full transition-opacity duration-200 ${
  i === active ? 'bg-white' : 'bg-[#666666]'
}`}
```

---

### `src/components/TimingControls.tsx` (component, request-response) -- NEW

**Analog:** `src/components/PageDots.tsx` (presentational component with props)

**Same structural patterns as BreathingCircle above.** Additional notes:

- Stepper buttons should use `aria-label` for accessibility (established pattern from PageDots using `aria-label`, `role="group"`)
- Conditional rendering/opacity follows the project's ternary-in-className pattern
- No event handler imports needed -- callbacks passed via props

**Layout reference for stable positioning** (`src/components/BreathingScreen.tsx`, line 6):
```typescript
className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex items-center justify-center bg-black"
```
The controls need absolute/fixed positioning or flex layout changes so D-17 (no layout shift) is respected.

---

### `src/hooks/useBreathingAnimation.ts` (hook, event-driven) -- NEW

**Analog:** `src/components/SwipeContainer.tsx` (useRef + useCallback pattern)

**Ref + callback pattern** (`src/components/SwipeContainer.tsx`, lines 1-12):
```typescript
import { useRef, useCallback, type ReactNode } from 'react';

// ...

export function SwipeContainer({ children, onPageChange }: SwipeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastIndexRef = useRef(0);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || el.clientWidth === 0) return;
    // ...
  }, []);
```

**Key patterns to follow for the hook:**
- Import `useRef, useCallback` from 'react'
- `useRef<HTMLDivElement>(null)` for element refs
- `useRef` for mutable values (animation instance) -- not useState
- `useCallback` with `[]` deps for stable function references
- Guard clause at top of callback: `if (!el) return;`
- Ref updates via `.current` assignment

**Hook file naming convention:** No existing hooks directory, but the project uses named exports consistently. Follow: `export function useBreathingAnimation() { ... }`

---

### `src/types/breathing.ts` (type, N/A) -- NEW

**No direct analog** in the codebase. The project currently defines interfaces inline (e.g., `PageDotsProps` in PageDots.tsx, `SwipeContainerProps` in SwipeContainer.tsx).

**Inline type pattern** (`src/components/SwipeContainer.tsx`, lines 3-6):
```typescript
interface SwipeContainerProps {
  children: ReactNode;
  onPageChange: (index: number) => void;
}
```

**Recommendation:** Since the breathing types (BreathingConfig, SessionState, BreathingAction) are shared across multiple files (hook, component, tests), a separate types file is justified. Follow the same `interface` keyword convention (not `type` aliases for object shapes).

---

### `src/__tests__/breathing-state.test.ts` (test, N/A) -- NEW

**Analog:** `src/__tests__/navigation.test.tsx`

**Test file structure** (`src/__tests__/navigation.test.tsx`, lines 1-5):
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
```

**Test organization pattern** (`src/__tests__/navigation.test.tsx`, lines 7-11):
```typescript
describe('Navigation Structure (D-04, D-06)', () => {
  it('renders 3 swipeable panels', () => {
    const { container } = render(<App />);
    const panels = container.querySelectorAll('[data-panel]');
    expect(panels.length).toBe(3);
  });
```

**Key patterns to follow:**
- Import `describe, it, expect` from 'vitest' (globals enabled but explicit imports used)
- Describe block references requirement IDs in parentheses: `'Description (REQ-ID)'`
- Individual `it` blocks are short, single-assertion where possible
- Use `expect(...).toBe(...)` for primitives, `expect(...).toBeDefined()` for existence
- For pure logic tests (reducer): no render/screen needed, just import the function and test

---

### `src/__tests__/breathing-screen.test.tsx` (test, N/A) -- NEW

**Analog:** `src/__tests__/navigation.test.tsx`

**Same patterns as breathing-state.test.ts above, plus:**

**Component render testing pattern** (`src/__tests__/navigation.test.tsx`, lines 29-33):
```typescript
it('renders breathing screen with static white circle (D-14)', () => {
  const { container } = render(<App />);
  const circle = container.querySelector('[data-testid="breathing-circle"]');
  expect(circle).not.toBeNull();
});
```

**Key patterns:**
- Use `render(<Component />)` from `@testing-library/react`
- Use `container.querySelector('[data-testid="..."]')` for DOM queries
- Use `screen.getByRole(...)` or `screen.getByText(...)` for accessible queries
- Reference decision IDs in test descriptions: `(D-09)`, `(BRTH-04)`

---

## Shared Patterns

### Named Exports (All Files)
**Source:** All existing components
**Apply to:** Every new file

All components and hooks use named exports, never default exports:
```typescript
export function ComponentName() { ... }
export function useHookName() { ... }
```

Exception: `src/App.tsx` uses `export default App` -- but it is the only file that does this.

### Tailwind Styling (All Components)
**Source:** `src/components/PageDots.tsx`, `src/components/BreathingScreen.tsx`
**Apply to:** BreathingCircle.tsx, TimingControls.tsx, BreathingScreen.tsx

All styling is done via Tailwind utility classes in `className`. No CSS modules, no inline style objects (except `env()` safe-area values). Conditional classes use template literals with ternary operators.

### Accessibility Attributes
**Source:** `src/components/PageDots.tsx` (role, aria-label), `src/components/BreathingScreen.tsx` (aria-label, data-testid)
**Apply to:** BreathingCircle.tsx, TimingControls.tsx

Pattern:
```typescript
<div aria-label="Descriptive label" data-testid="test-selector">
<button aria-label={`Action description`} disabled={condition}>
```

### Test Structure
**Source:** `src/__tests__/navigation.test.tsx`
**Apply to:** All test files

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Feature Name (REQ-IDs)', () => {
  it('does specific thing', () => {
    // arrange, act, assert
  });
});
```

### Ref Pattern for Imperative Operations
**Source:** `src/components/SwipeContainer.tsx`
**Apply to:** useBreathingAnimation.ts, BreathingCircle.tsx

```typescript
const elementRef = useRef<HTMLDivElement>(null);
// ...
const el = elementRef.current;
if (!el) return; // guard clause
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/types/breathing.ts` | type | N/A | No shared type files exist yet -- project currently uses inline interfaces. This is the first cross-file type definition. |
| `src/hooks/useBreathingAnimation.ts` | hook | event-driven | No custom hooks exist yet -- but SwipeContainer demonstrates the ref+callback pattern that will be extracted into a hook. |

## Metadata

**Analog search scope:** `src/` directory (all TypeScript/TSX files)
**Files scanned:** 12
**Pattern extraction date:** 2026-05-10
