# Phase 4: Wake Lock & Session Polish - Research

**Researched:** 2026-05-10
**Domain:** Screen Wake Lock API / iOS PWA session management
**Confidence:** HIGH

## Summary

Phase 4 requires preventing the screen from dimming or locking during an active breathing session. The Screen Wake Lock API is the standard browser API for this purpose and has been supported in iOS Safari since version 16.4 (March 2023). Given that iOS 26 is the current major version in 2026, essentially all target devices support the native API -- no fallback library (like NoSleep.js) is needed.

The implementation is straightforward: a custom React hook (`useWakeLock`) that acquires a wake lock when a session starts and releases it when the session stops. The main complexity is handling the visibility change lifecycle -- the browser automatically releases wake locks when the page becomes hidden, so the hook must reacquire the lock when the page becomes visible again (if the session is still active).

**Primary recommendation:** Use the native Screen Wake Lock API (`navigator.wakeLock.request('screen')`) with a visibility change reacquisition pattern. No third-party library needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRTH-13 | Screen does not lock during active session | Native Screen Wake Lock API (iOS Safari 16.4+) with useWakeLock hook pattern; visibility change reacquisition handles backgrounding; release on session stop |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Wake lock acquisition/release | Browser / Client | -- | Screen Wake Lock is a client-side browser API, no server involvement |
| Session state tracking | Browser / Client | -- | React state already tracks session='running'/'idle' |
| Visibility change handling | Browser / Client | -- | document.visibilitychange is a client-side event |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Screen Wake Lock API | Web Standard | Prevent screen dimming/locking | Native browser API, no dependencies, fully typed in TypeScript DOM lib |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | -- | -- | -- |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native Wake Lock API | NoSleep.js v0.12.0 | NoSleep.js is 74KB, last updated Dec 2020, uses hacky video trick for iOS < 16.4 which no longer exists in the wild. Native API is zero-dependency and fully supported. |
| Native Wake Lock API | nosleep-on-ios | Repository appears unmaintained/non-existent. Not a viable option. |

**Installation:**
```bash
# No packages to install - using native browser API with existing TypeScript DOM types
```

**Version verification:** The Screen Wake Lock API types are already included in TypeScript's `lib.dom.d.ts` (confirmed in project's `node_modules/typescript/lib/lib.dom.d.ts`). The project's tsconfig uses `"lib": ["ES2023", "DOM", "DOM.Iterable"]` which includes these types. [VERIFIED: local filesystem check]

## Architecture Patterns

### System Architecture Diagram

```
User taps circle (START)
    |
    v
BreathingScreen.handleCircleTap()
    |
    +---> dispatch({ type: 'START' })  --> state.session = 'running'
    +---> start(config)                --> animation begins
    +---> audioStart(config)           --> audio cues begin
    +---> wakeLock.request()           --> screen stays awake  [NEW]
    
User taps circle (STOP)
    |
    v
BreathingScreen.handleCircleTap()
    |
    +---> dispatch({ type: 'STOP' })   --> state.session = 'idle'
    +---> stop()                       --> animation stops
    +---> audioStop()                  --> audio stops
    +---> wakeLock.release()           --> normal screen lock resumes  [NEW]

Page becomes hidden (e.g., switch tab, lock screen manually)
    |
    v
Browser automatically releases wake lock sentinel
    |
    v
visibilitychange event fires when page becomes visible again
    |
    v
If session still 'running': reacquire wake lock
```

### Recommended Project Structure
```
src/
  hooks/
    useWakeLock.ts        # NEW - Wake lock lifecycle hook
  components/
    BreathingScreen.tsx   # MODIFIED - integrates useWakeLock
  __tests__/
    wake-lock.test.ts     # NEW - unit tests for useWakeLock
```

### Pattern 1: useWakeLock Hook
**What:** A React hook that encapsulates wake lock acquisition, release, and reacquisition on visibility change.
**When to use:** Any component that needs to prevent screen sleep during an active state.
**Example:**
```typescript
// Source: MDN Screen Wake Lock API docs + React hook pattern
import { useRef, useCallback, useEffect } from 'react';

export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const activeRef = useRef(false);

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen');
      sentinelRef.current.addEventListener('release', () => {
        sentinelRef.current = null;
      });
    } catch (err) {
      // System may reject (low battery, power save mode)
      console.warn('Wake lock request failed:', (err as Error).message);
    }
  }, []);

  const release = useCallback(async () => {
    activeRef.current = false;
    if (sentinelRef.current && !sentinelRef.current.released) {
      await sentinelRef.current.release();
      sentinelRef.current = null;
    }
  }, []);

  const activate = useCallback(async () => {
    activeRef.current = true;
    await request();
  }, [request]);

  // Reacquire on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (activeRef.current && document.visibilityState === 'visible') {
        await request();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [request]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sentinelRef.current && !sentinelRef.current.released) {
        sentinelRef.current.release();
      }
    };
  }, []);

  return { activate, release };
}
```

### Pattern 2: Integration in BreathingScreen
**What:** Wire useWakeLock into the existing start/stop flow.
**When to use:** In the BreathingScreen component alongside existing animation and audio hooks.
**Example:**
```typescript
// In BreathingScreen.tsx
const { activate: wakeLockActivate, release: wakeLockRelease } = useWakeLock();

const handleCircleTap = () => {
  if (state.session === 'idle') {
    dispatch({ type: 'START' });
    start(state.config);
    audioStart(state.config);
    wakeLockActivate(); // Acquire wake lock
  } else {
    dispatch({ type: 'STOP' });
    stop();
    audioStop();
    wakeLockRelease(); // Release wake lock
  }
};
```

### Anti-Patterns to Avoid
- **Acquiring wake lock outside user gesture context:** On some browsers, the initial request may need to originate from a user gesture. Since the session starts on tap (user gesture), this is naturally satisfied.
- **Not handling visibility change:** The browser WILL release the lock when the page is hidden. If you don't listen for visibilitychange, the lock won't be reacquired when the user returns.
- **Holding wake lock after session ends:** Always release on STOP -- leaving it active drains battery unnecessarily.
- **Not guarding against missing API:** Always feature-detect with `'wakeLock' in navigator` before using.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Prevent screen sleep | Video loop hack, periodic location pings, canvas tricks | `navigator.wakeLock.request('screen')` | Native API is clean, power-efficient, and universally supported on target devices |
| iOS audio unlock | Custom AudioContext resume logic | Existing Howler.js setup (already handles this in Phase 3) | Already solved in useBreathingAudio.ts |

**Key insight:** In 2026, NoSleep.js and video-loop hacks are legacy solutions for iOS < 16.4. The native API is the correct approach for any app targeting modern iOS.

## Common Pitfalls

### Pitfall 1: Wake Lock Released on Visibility Change
**What goes wrong:** The screen starts locking again when the user briefly switches apps and comes back.
**Why it happens:** The browser spec requires wake locks to be released when the document becomes hidden.
**How to avoid:** Listen for `visibilitychange` and reacquire the lock when `document.visibilityState === 'visible'` and the session is still active.
**Warning signs:** Works perfectly in testing but users report screen locking "randomly" after receiving a notification or briefly switching apps.

### Pitfall 2: Wake Lock Request Rejected Silently
**What goes wrong:** `navigator.wakeLock.request()` throws but the session continues without wake lock.
**Why it happens:** System can reject due to low battery mode, power saving settings, or insufficient permissions.
**How to avoid:** Wrap in try-catch, log warnings. The session should still function -- wake lock is a best-effort enhancement, not a hard requirement.
**Warning signs:** No error visible to user, but screen dims during session on low-battery devices.

### Pitfall 3: Forgetting Feature Detection
**What goes wrong:** `navigator.wakeLock` is undefined, causing a runtime TypeError.
**Why it happens:** Code runs in a non-HTTPS context, in a WebView, or during testing (jsdom).
**How to avoid:** Always check `'wakeLock' in navigator` before calling request.
**Warning signs:** Crash on first session start in development (localhost without HTTPS) or in test environment.

### Pitfall 4: Memory Leak from Event Listener
**What goes wrong:** visibilitychange listener not cleaned up on component unmount.
**Why it happens:** Using `document.addEventListener` without a corresponding `removeEventListener` in the cleanup function.
**How to avoid:** Return cleanup function from useEffect that removes the listener.
**Warning signs:** Multiple wake lock requests stacking up after component remounts.

## Code Examples

Verified patterns from official sources:

### Feature Detection + Request
```typescript
// Source: MDN Screen Wake Lock API docs
// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
const isSupported = 'wakeLock' in navigator;

if (isSupported) {
  try {
    const sentinel = await navigator.wakeLock.request('screen');
    // Lock active
  } catch (err) {
    // Request rejected (low battery, power save, etc.)
  }
}
```

### Release Pattern
```typescript
// Source: MDN WakeLockSentinel docs
// https://developer.mozilla.org/en-US/docs/Web/API/WakeLockSentinel
if (sentinel && !sentinel.released) {
  await sentinel.release();
  // sentinel.released === true after this
}
```

### Visibility Change Reacquisition
```typescript
// Source: MDN Screen Wake Lock API docs
// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    wakeLock = await navigator.wakeLock.request('screen');
  }
});
```

### Testing Mock Pattern
```typescript
// Pattern for mocking Wake Lock API in vitest/jsdom
const mockRelease = vi.fn().mockResolvedValue(undefined);
const mockSentinel = {
  released: false,
  type: 'screen' as const,
  release: mockRelease,
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
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NoSleep.js video loop hack | Screen Wake Lock API | iOS Safari 16.4 (March 2023) | Zero dependencies, native, power-efficient |
| Page reload every 15s (iOS < 10) | Screen Wake Lock API | Legacy -- dead approach | No longer relevant |
| Invisible video element playback | Screen Wake Lock API | iOS Safari 16.4+ | Video trick was 74KB+ of JS, drained battery |

**Deprecated/outdated:**
- NoSleep.js (v0.12.0, last updated Dec 2020): Only needed for iOS < 16.4 which is no longer in the wild [VERIFIED: npm registry shows last publish 2020-12-16]
- Video loop trick: Was the iOS-specific workaround that NoSleep.js implemented; native API replaces it entirely

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Screen Wake Lock API works in iOS PWA standalone mode (display: standalone) | Architecture Patterns | If wrong, NoSleep.js fallback needed. LOW risk -- API works in secure context which standalone PWAs are. |
| A2 | iOS 16.4+ has near-100% adoption in 2026 (given iOS 26 is current) | Standard Stack | If wrong, need NoSleep.js fallback for older devices. VERY LOW risk -- Apple enforces updates aggressively. |

## Open Questions

1. **Does Screen Wake Lock work in iOS standalone PWA mode?**
   - What we know: It works in Safari browser (confirmed via caniuse.com and WebKit release notes for 16.4). Standalone PWAs use the same WebKit engine.
   - What's unclear: No explicit official documentation confirming standalone mode support (WebKit blog mentions the API but not PWA-specific behavior).
   - Recommendation: Implement with feature detection (`'wakeLock' in navigator`). If the API is not available in standalone mode (unlikely), it gracefully degrades to no-op. Manual testing on iOS device will confirm.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 with jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRTH-13 | Screen stays awake during active session | unit | `npx vitest run src/__tests__/wake-lock.test.ts --reporter=verbose` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `src/__tests__/wake-lock.test.ts` -- covers BRTH-13 (wake lock acquire on start, release on stop, reacquire on visibility change)
- Navigator.wakeLock mock setup (no shared setup file currently -- can be local to test file)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | -- |
| V3 Session Management | no | -- |
| V4 Access Control | no | -- |
| V5 Input Validation | no | -- |
| V6 Cryptography | no | -- |

This phase has no security surface -- the Screen Wake Lock API is a display-only concern with no user data, network calls, or authentication involved. The API requires HTTPS which is already in place (PWA requirement from Phase 1).

### Known Threat Patterns for Wake Lock

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| (none applicable) | -- | -- |

## Sources

### Primary (HIGH confidence)
- MDN Screen Wake Lock API docs -- API usage, lifecycle, reacquisition pattern [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API]
- MDN WakeLockSentinel docs -- properties, methods, release event [CITED: https://developer.mozilla.org/en-US/docs/Web/API/WakeLockSentinel]
- caniuse.com/wake-lock -- iOS Safari 16.4+ support confirmed [CITED: https://caniuse.com/wake-lock]
- WebKit Safari 16.4 release notes -- confirms Wake Lock API added [CITED: https://webkit.org/blog/13966/webkit-features-in-safari-16-4/]
- TypeScript lib.dom.d.ts -- full WakeLock/WakeLockSentinel type definitions present [VERIFIED: local filesystem]
- npm registry -- NoSleep.js v0.12.0 last published 2020-12-16 [VERIFIED: npm registry]
- Chrome developer docs -- best practices and lifecycle guide [CITED: https://developer.chrome.com/articles/wake-lock]

### Secondary (MEDIUM confidence)
- Apple developer support page -- iOS 26 at 66% adoption, iOS 16.4+ effectively universal [CITED: https://developer.apple.com/support/app-store/]

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native browser API with TypeScript types already in project, confirmed browser support
- Architecture: HIGH - Simple hook pattern matching existing project conventions (useBreathingAnimation, useBreathingAudio)
- Pitfalls: HIGH - Well-documented API lifecycle; visibility change issue is explicitly covered in official docs

**Research date:** 2026-05-10
**Valid until:** 2027-05-10 (stable Web Standard, unlikely to change)
