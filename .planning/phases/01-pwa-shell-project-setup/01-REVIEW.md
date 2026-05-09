---
phase: 01-pwa-shell-project-setup
reviewed: 2026-05-09T12:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - eslint.config.js
  - index.html
  - package.json
  - src/__tests__/manifest.test.ts
  - src/__tests__/meta-tags.test.ts
  - src/__tests__/navigation.test.tsx
  - src/__tests__/pwa-config.test.ts
  - src/App.css
  - src/App.tsx
  - src/components/BreathingScreen.tsx
  - src/components/LandingScreen.tsx
  - src/components/MeditationScreen.tsx
  - src/components/PageDots.tsx
  - src/components/SwipeContainer.tsx
  - src/main.tsx
  - src/vite-env.d.ts
  - tsconfig.app.json
  - tsconfig.json
  - tsconfig.node.json
  - vite.config.ts
  - vitest.config.ts
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-09T12:00:00Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

The PWA shell project setup is well-structured with appropriate technology choices (React 19, Vite, Tailwind CSS 4, vite-plugin-pwa). The component architecture is clean and the CSS-based horizontal scroll/snap approach for swipe navigation is a sound choice for iOS PWA.

Key concerns:
1. The `SwipeContainer` has a division-by-zero risk when `clientWidth` is 0 (can happen during render before layout)
2. The `PageDots` component has an ARIA accessibility violation (non-interactive `div` with `role="tab"`)
3. The `onPageChange` callback in `SwipeContainer` is stale-closure-prone due to `useCallback` dependency on `onPageChange` without memoization from the parent
4. The `apple-mobile-web-app-title` inconsistency (`buho`) vs the HTML title (`mindfulONE`) could confuse users

## Critical Issues

### CR-01: Division by zero in SwipeContainer scroll handler

**File:** `src/components/SwipeContainer.tsx:15`
**Issue:** `Math.round(el.scrollLeft / el.clientWidth)` will produce `NaN` (via division by zero) if `clientWidth` is 0. This can occur when the container has not yet been laid out (e.g., during initial render in certain iOS scenarios, or if the element is hidden/display:none). `Math.round(NaN)` is `NaN`, which will never equal `lastIndexRef.current` (a number), so `onPageChange` would be called with `NaN` as the index, potentially corrupting downstream state.
**Fix:**
```typescript
const handleScroll = useCallback(() => {
  const el = containerRef.current;
  if (!el || el.clientWidth === 0) return;
  const index = Math.round(el.scrollLeft / el.clientWidth);
  if (index !== lastIndexRef.current) {
    lastIndexRef.current = index;
    onPageChange(index);
  }
}, [onPageChange]);
```

## Warnings

### WR-01: ARIA role="tab" on non-interactive div elements without tabpanel association

**File:** `src/components/PageDots.tsx:15-22`
**Issue:** The dots use `role="tab"` on plain `div` elements. Per WAI-ARIA, `tab` role requires the element to be focusable (via `tabIndex`) and must be associated with a `tabpanel` via `aria-controls`. Without these, the component fails ARIA authoring requirements. Screen readers will announce these as tabs but users cannot interact with them via keyboard, creating an accessibility trap.
**Fix:** Either make the dots interactive (use `button` elements with `onClick` to navigate, add `tabIndex={0}`, and add `aria-controls` pointing to panels), or change the role to a presentational indicator pattern:
```tsx
<div role="group" aria-label="Navigation indicator">
  {Array.from({ length: total }, (_, i) => (
    <div
      key={i}
      aria-hidden="true"
      className={`w-2 h-2 rounded-full transition-opacity duration-200 ${
        i === active ? 'bg-white' : 'bg-[#666666]'
      }`}
    />
  ))}
</div>
```

### WR-02: PageDots aria-label array access has no bounds check

**File:** `src/components/PageDots.tsx:19`
**Issue:** `aria-label={['Landing', 'Breathing', 'Meditation'][i]}` accesses a hardcoded 3-element array by index `i` which is derived from `total`. If `total` is ever changed to a value > 3 (or if the component is reused), the label will be `undefined`, causing `aria-label="undefined"` in the DOM. The labels are also tightly coupled to the page order defined in `App.tsx` without any shared source of truth.
**Fix:** Pass labels as a prop or derive them from the children/page configuration:
```tsx
interface PageDotsProps {
  total: number;
  active: number;
  labels: string[];
}

// Usage in App.tsx:
<PageDots total={3} active={activePage} labels={['Landing', 'Breathing', 'Meditation']} />
```

### WR-03: SwipeContainer onPageChange dependency creates re-render instability

**File:** `src/components/SwipeContainer.tsx:12`
**Issue:** `handleScroll` uses `useCallback` with `[onPageChange]` as a dependency. In `App.tsx`, `onPageChange` is `setActivePage` (a stable React state setter), so this works today. However, if the parent ever wraps the callback (e.g., `onPageChange={(i) => { setActivePage(i); trackAnalytics(i); }}`), the inline arrow function will be recreated every render, causing `handleScroll` to be recreated every render, which re-attaches the scroll listener if the component used `useEffect` (currently it uses `onScroll` prop, so it is fine for now). This is a latent maintenance risk rather than a current bug.
**Fix:** Consider using a ref to hold the latest callback to decouple rendering from the callback identity:
```typescript
const onPageChangeRef = useRef(onPageChange);
onPageChangeRef.current = onPageChange;

const handleScroll = useCallback(() => {
  const el = containerRef.current;
  if (!el || el.clientWidth === 0) return;
  const index = Math.round(el.scrollLeft / el.clientWidth);
  if (index !== lastIndexRef.current) {
    lastIndexRef.current = index;
    onPageChangeRef.current(index);
  }
}, []);
```

### WR-04: Tests rely on string matching against vite.config.ts source text

**File:** `src/__tests__/manifest.test.ts:6-10`, `src/__tests__/pwa-config.test.ts:5-9`
**Issue:** These tests read `vite.config.ts` as a string and use `toContain()` to verify configuration. This is extremely brittle: any formatting change (e.g., adding a comment, reformatting with prettier, switching from single to double quotes) will break the tests without any actual behavior change. The tests do not validate the runtime behavior (e.g., that the built manifest.json actually contains correct values). They provide false confidence -- passing tests without proving the output is correct.
**Fix:** For robust validation, either:
1. Import the vite config and assert on the parsed object (requires exporting the config or using `vite`'s API to load it), or
2. Add a build-time integration test that runs `vite build` and then reads the generated `manifest.webmanifest` file to verify its JSON contents.

## Info

### IN-01: Name inconsistency between app title and short_name/apple-mobile-web-app-title

**File:** `index.html:9`, `index.html:12`, `vite.config.ts:15-16`
**Issue:** The HTML `<title>` is "mindfulONE", `short_name` is "buho", and `apple-mobile-web-app-title` is "buho". This means the app will show as "buho" on the iOS home screen but "mindfulONE" in the browser tab. This may be intentional branding, but it could confuse users who installed "mindfulONE" and now see "buho" on their home screen.
**Fix:** If intentional, add a comment explaining the branding choice. If not, align the names.

### IN-02: vitest.config.ts sets globals: true but tests import from vitest

**File:** `vitest.config.ts:5`, `src/__tests__/manifest.test.ts:1`
**Issue:** The vitest config sets `globals: true` which makes `describe`, `it`, `expect` available globally without imports. However, all test files explicitly import `{ describe, it, expect } from 'vitest'`. This is not a bug (explicit imports still work with globals enabled), but it is inconsistent -- either remove `globals: true` since imports are used, or remove the imports to rely on globals. The `setupFiles: []` is also an empty array that serves no purpose.
**Fix:** Remove `globals: true` since explicit imports are already used (this is actually the safer pattern for TypeScript type inference):
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
  },
});
```

---

_Reviewed: 2026-05-09T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
