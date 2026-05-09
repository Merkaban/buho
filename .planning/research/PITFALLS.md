# Pitfalls Research: Meditation PWA

## Critical Pitfalls

### 1. iOS Audio Autoplay Restriction
**What goes wrong:** Audio won't play unless triggered by a user gesture. If you try to play audio on a timer tick, iOS silently blocks it.

**Warning signs:** Audio works in Chrome desktop but not Safari/iOS. No error thrown — just silence.

**Prevention:**
- Unlock AudioContext on the first "Start" button tap
- Pre-create all audio buffers after unlock
- Use Web Audio API (AudioContext) not just HTMLAudioElement
- Test on actual iOS device early (simulators may not reproduce)

**Phase:** Should be addressed in Phase 4 (Audio Integration)

---

### 2. iOS PWA Wake Lock Doesn't Exist
**What goes wrong:** The Screen Wake Lock API (`navigator.wakeLock`) is not supported in iOS Safari or iOS PWA mode. Screen locks after system timeout.

**Warning signs:** Works on Android/Chrome but screen dims and locks on iOS after 30-60 seconds.

**Prevention:**
- Use NoSleep.js which plays a tiny invisible video to keep the screen awake
- Test in actual PWA mode (Add to Home Screen), not just browser tab
- Verify wake lock survives app going to background briefly

**Phase:** Should be addressed in Phase 5 (Wake Lock)

---

### 3. iOS PWA Reload on Background
**What goes wrong:** iOS aggressively kills PWA processes when backgrounded. Returning to the app may restart it entirely, losing session state.

**Warning signs:** User switches to another app briefly, comes back to the meditation app reset to initial state.

**Prevention:**
- Save session state (isRunning, currentPhase, timestamp) to localStorage on visibilitychange
- On app resume, detect if session was active and offer to continue
- Keep timer logic resilient to pause/resume

**Phase:** Should be addressed in Phase 3 (Timer Engine) and Phase 5 (Wake Lock)

---

### 4. PWA Install UX on iOS
**What goes wrong:** iOS has no "Add to Home Screen" prompt like Android. Users won't know how to install it.

**Warning signs:** Users just use it in Safari, never getting the standalone experience.

**Prevention:**
- Show a brief install instruction on first visit ("Tap Share → Add to Home Screen")
- Detect standalone mode via `window.matchMedia('(display-mode: standalone)')`
- Only show instruction when running in browser, not after install

**Phase:** Should be addressed in Phase 1 (PWA Shell)

---

### 5. Animation Timing Drift
**What goes wrong:** Using setInterval for timing causes drift over long sessions. After 10 minutes, animation and audio may be noticeably out of sync.

**Warning signs:** Audio cues fire slightly before/after the circle reaches its target size.

**Prevention:**
- Use requestAnimationFrame with elapsed time calculation, not setInterval
- Base all state on absolute timestamps, not accumulated deltas
- Audio trigger on phase transition event, not on separate timer

**Phase:** Should be addressed in Phase 2 (Timer Engine)

---

## Medium Pitfalls

### 6. Service Worker Cache Staleness
**What goes wrong:** After deploying an update, users keep seeing the old version because the service worker serves cached assets.

**Prevention:**
- Use vite-plugin-pwa's auto-update strategy (prompt or immediate)
- Version your service worker
- Show "Update available" UI when new version detected

**Phase:** Phase 1 (PWA Shell)

---

### 7. iOS Safe Area / Notch
**What goes wrong:** Content gets hidden behind the notch or bottom bar on modern iPhones in standalone PWA mode.

**Prevention:**
- Use `viewport-fit=cover` in meta viewport
- Apply `env(safe-area-inset-*)` CSS padding
- Test on notched device

**Phase:** Phase 1 (PWA Shell)

---

### 8. Audio File Size
**What goes wrong:** Large audio files (especially background music) make initial load slow and eat storage quota.

**Prevention:**
- Compress audio to reasonable quality (128kbps MP3 or equivalent)
- Background music: consider a short loop (30-60 seconds) rather than a long track
- Precache audio in service worker for offline use

**Phase:** Phase 4 (Audio Integration)

---

## Low-Risk Pitfalls

### 9. Dark Mode Flash
**What goes wrong:** Brief white flash on app load before dark styles apply.

**Prevention:**
- Set `background-color` in manifest and meta theme-color to dark color
- Inline critical dark-mode CSS in HTML head

**Phase:** Phase 1 (PWA Shell)

### 10. Touch Event Conflicts
**What goes wrong:** Swipe gesture interferes with settings controls (sliders, inputs).

**Prevention:**
- Only enable swipe on the main content area, not on settings overlay
- Use pointer events to distinguish between scroll/swipe/tap

**Phase:** Phase 7 (Swipe Navigation)
