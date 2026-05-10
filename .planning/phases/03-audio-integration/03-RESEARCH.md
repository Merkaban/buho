# Phase 3: Audio Integration - Research

**Researched:** 2026-05-10
**Domain:** Web Audio / iOS Safari audio playback / PWA offline audio
**Confidence:** HIGH

## Summary

This phase adds voice cues ("breathe in", "hold your breath", "breathe out") and looping background music to the breathing session. The primary technical challenge is iOS Safari's audio autoplay restriction, which requires audio context initialization within a user gesture handler. The secondary challenge is keeping audio cues synchronized with the breathing animation cycle.

Howler.js (v2.2.4) is the recommended audio library. It abstracts iOS Safari's autoplay unlock, provides native mute/unmute without stopping playback (required by D-04), handles looping, and manages the Web Audio API context lifecycle. The project's existing custom hook pattern (`useBreathingAnimation`) naturally extends to a `useBreathingAudio` hook that owns all audio state.

**Primary recommendation:** Use Howler.js for all audio playback, create a `useBreathingAudio` custom hook that schedules voice cues via setTimeout aligned with breathing config durations, and mute/unmute (not stop/start) background music for the toggle.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Music toggle is a speaker icon button positioned in the bottom corner of the screen
- **D-02:** Toggle is always visible -- does not fade out when session starts (unlike timing controls)
- **D-03:** Toggling music off cuts immediately (no fade)
- **D-04:** Music keeps its loop position internally when toggled off -- toggling back on continues from where it was (unmutes rather than restarts)
- **D-05:** No audio ducking -- voice cues and music play simultaneously at their set volumes
- **D-06:** Voice cues always play during a session regardless of music toggle state (music toggle only controls music)
- **D-07:** No independent mute for voice cues in this phase -- cues always accompany the session
- **D-08:** Background music auto-starts when session begins (if music toggle is on) -- one tap starts everything
- **D-09:** Brief pause (~0.5-1s) before first voice cue plays -- gives user a moment to settle after tapping
- **D-10:** When session stops, everything stops immediately (music and any playing voice cue cut)
- **D-11:** iOS audio unlock handled by the session start tap gesture (same tap that starts animation)
- **D-12:** Voice cue placeholders: TTS-generated "breathe in", "hold your breath", "breathe out" clips
- **D-13:** Background music placeholder: ocean waves sound (royalty-free)
- **D-14:** Audio format: MP3 for all files (universal iOS Safari support)
- **D-15:** Final audio files will be provided by user later -- architecture must support simple file swap

### Claude's Discretion
- Audio library choice (Howler.js vs raw Web Audio API)
- Hook architecture and integration pattern with existing animation hook
- Audio file organization and naming
- Test strategy for audio in jsdom environment

### Deferred Ideas (OUT OF SCOPE)
- Independent voice cue mute toggle
- Volume controls (separate music/cue volume sliders)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRTH-09 | "Breathe in" audio plays at start of inhale | Howler.js play() triggered by setTimeout at cycle start + initial delay (D-09) |
| BRTH-10 | "Hold your breath" audio plays at start of hold | Howler.js play() triggered by setTimeout at inhale duration offset |
| BRTH-11 | "Breathe out" audio plays at start of exhale | Howler.js play() triggered by setTimeout at inhale+hold duration offset |
| BRTH-12 | Background music can be toggled on/off | Howler.js mute(true/false) preserves loop position per D-04 |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Audio context unlock | Browser / Client | -- | iOS requires user gesture in the same JS execution frame |
| Voice cue scheduling | Browser / Client | -- | setTimeout-based, synchronized with animation config |
| Background music loop | Browser / Client | -- | Web Audio API via Howler.js, client-only |
| Music toggle state | Browser / Client | -- | React state in reducer, no persistence needed yet |
| Audio file serving | CDN / Static | -- | MP3 files in public/ directory, precached by service worker |
| Offline audio | CDN / Static | Browser / Client | Workbox precaches MP3s; Web Audio API plays from cache |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| howler | 2.2.4 | Audio playback, iOS unlock, looping, mute/unmute | [VERIFIED: npm registry] Battle-tested cross-browser audio. Handles iOS Safari autoplay, Web Audio API with HTML5 fallback. 25k+ GitHub stars. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/howler | 2.2.12 | TypeScript definitions for howler | [VERIFIED: npm registry] Always -- project uses TypeScript |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Howler.js | Raw Web Audio API | More control, zero deps, but must hand-roll iOS unlock, mute/unmute state, loop management, error handling |
| Howler.js | use-sound (v5.0.0) | React-native hook, but too simple for mute-without-stopping pattern (D-04), designed for one-shot SFX |
| Howler.js | Tone.js | Full music production library, extreme overkill for playback-only |

**Installation:**
```bash
npm install howler && npm install -D @types/howler
```

**Version verification:**
- howler: 2.2.4 [VERIFIED: npm registry 2026-05-10]
- @types/howler: 2.2.12 [VERIFIED: npm registry 2026-05-10]

## Architecture Patterns

### System Architecture Diagram

```
User Tap (session start)
    |
    v
[BreathingScreen handleCircleTap]
    |
    +---> [useBreathingAnimation.start(config)]
    |         |
    |         +---> startCycle() --onfinish--> startCycle() ...
    |
    +---> [useBreathingAudio.start(config)]
              |
              +---> AudioContext.resume() (iOS unlock)
              +---> musicHowl.mute(false) / play() (if toggle on)
              +---> scheduleCueCycle(config, isFirstCycle=true)
                        |
                        +---> setTimeout(0 + delay) --> play("breathe in")
                        +---> setTimeout(inhale*1000 + delay) --> play("hold")
                        +---> setTimeout((inhale+hold)*1000 + delay) --> play("exhale")
                        +---> setTimeout(totalCycle + delay) --> scheduleCueCycle(config, false)

User Tap (session stop)
    |
    v
[BreathingScreen handleCircleTap]
    |
    +---> [useBreathingAnimation.stop()]
    +---> [useBreathingAudio.stop()]
              |
              +---> clearAllTimeouts()
              +---> musicHowl.stop()
              +---> cueHowl.stop()
```

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useBreathingAnimation.ts  (existing)
│   └── useBreathingAudio.ts      (NEW - audio scheduling + playback)
├── components/
│   ├── BreathingScreen.tsx        (modified - integrate audio hook + music toggle)
│   ├── MusicToggle.tsx            (NEW - speaker icon button)
│   └── ...
├── types/
│   └── breathing.ts               (modified - add TOGGLE_MUSIC action)
└── ...
public/
└── audio/
    ├── breathe-in.mp3             (placeholder TTS)
    ├── hold.mp3                   (placeholder TTS)
    ├── breathe-out.mp3            (placeholder TTS)
    └── ocean-waves.mp3            (placeholder background music)
```

### Pattern 1: Custom Audio Hook (`useBreathingAudio`)
**What:** Encapsulates all Howler.js instances, scheduling logic, and music toggle state
**When to use:** Follows established `useBreathingAnimation` pattern -- one hook per concern

```typescript
// Source: Architecture derived from existing useBreathingAnimation pattern + Howler.js API [CITED: github.com/goldfire/howler.js README]
import { useRef, useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import type { BreathingConfig } from '../types/breathing';

export function useBreathingAudio() {
  const cuesRef = useRef<{ in: Howl; hold: Howl; out: Howl } | null>(null);
  const musicRef = useRef<Howl | null>(null);
  const timersRef = useRef<number[]>([]);
  const runningRef = useRef(false);
  const musicEnabledRef = useRef(true);

  // Initialize Howl instances once (lazy)
  const ensureLoaded = useCallback(() => {
    if (!cuesRef.current) {
      cuesRef.current = {
        in: new Howl({ src: ['/audio/breathe-in.mp3'], preload: true }),
        hold: new Howl({ src: ['/audio/hold.mp3'], preload: true }),
        out: new Howl({ src: ['/audio/breathe-out.mp3'], preload: true }),
      };
    }
    if (!musicRef.current) {
      musicRef.current = new Howl({
        src: ['/audio/ocean-waves.mp3'],
        loop: true,
        preload: true,
        volume: 0.4,
      });
    }
  }, []);

  const scheduleCycle = useCallback((config: BreathingConfig, delay: number) => {
    if (!runningRef.current || !cuesRef.current) return;

    const { inhale, hold, exhale } = config;
    const totalMs = (inhale + hold + exhale) * 1000;

    // Schedule voice cues
    const t1 = window.setTimeout(() => {
      if (runningRef.current) cuesRef.current?.in.play();
    }, delay);

    const t2 = hold > 0
      ? window.setTimeout(() => {
          if (runningRef.current) cuesRef.current?.hold.play();
        }, delay + inhale * 1000)
      : -1;

    const t3 = window.setTimeout(() => {
      if (runningRef.current) cuesRef.current?.out.play();
    }, delay + (inhale + hold) * 1000);

    // Schedule next cycle
    const t4 = window.setTimeout(() => {
      scheduleCycle(config, 0);
    }, delay + totalMs);

    timersRef.current.push(t1, t3, t4);
    if (t2 !== -1) timersRef.current.push(t2);
  }, []);

  const start = useCallback((config: BreathingConfig) => {
    ensureLoaded();
    runningRef.current = true;

    // Start music if enabled
    if (musicEnabledRef.current && musicRef.current) {
      musicRef.current.play();
    }

    // Schedule first cycle with D-09 delay
    const INITIAL_DELAY_MS = 800;
    scheduleCycle(config, INITIAL_DELAY_MS);
  }, [ensureLoaded, scheduleCycle]);

  const stop = useCallback(() => {
    runningRef.current = false;
    // Clear all scheduled timeouts
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
    // Stop all audio immediately (D-10)
    musicRef.current?.stop();
    cuesRef.current?.in.stop();
    cuesRef.current?.hold.stop();
    cuesRef.current?.out.stop();
  }, []);

  const toggleMusic = useCallback((enabled: boolean) => {
    musicEnabledRef.current = enabled;
    if (musicRef.current) {
      musicRef.current.mute(!enabled); // D-04: mute preserves position
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stop(); }, [stop]);

  return { start, stop, toggleMusic, ensureLoaded };
}
```

### Pattern 2: iOS Audio Unlock via Session Start Tap
**What:** Resume AudioContext within the user gesture handler that starts the session
**When to use:** Required for iOS Safari -- audio will not play without this

```typescript
// Source: [CITED: developer.chrome.com/blog/web-audio-autoplay] + [CITED: github.com/goldfire/howler.js README]
// In BreathingScreen handleCircleTap:
const handleCircleTap = () => {
  if (state.session === 'idle') {
    // Howler.js auto-unlock: calling play() within a user gesture handler
    // unlocks the AudioContext automatically. No manual resume() needed.
    dispatch({ type: 'START' });
    animStart(state.config);
    audioStart(state.config);  // This triggers Howl.play() inside gesture handler
  } else {
    dispatch({ type: 'STOP' });
    animStop();
    audioStop();
  }
};
```

### Pattern 3: Music Toggle with Mute (not Stop)
**What:** Toggle button mutes/unmutes the Howl instance without stopping playback
**When to use:** D-04 requires position preservation

```typescript
// Source: [CITED: github.com/goldfire/howler.js README - mute method]
// Muting preserves internal playback position
musicHowl.mute(true);   // Audio goes silent, loop continues
musicHowl.mute(false);  // Audio resumes from current position
```

### Pattern 4: Placeholder Audio Generation
**What:** Use macOS `say` + `ffmpeg` to create TTS placeholder MP3 files
**When to use:** During development before user provides final audio files

```bash
# Generate voice cues using macOS TTS (Samantha voice -- natural US English)
say -v Samantha -o /tmp/breathe-in.aiff "Breathe in"
say -v Samantha -o /tmp/hold.aiff "Hold your breath"
say -v Samantha -o /tmp/breathe-out.aiff "Breathe out"

# Convert AIFF to MP3 with ffmpeg
ffmpeg -i /tmp/breathe-in.aiff -codec:a libmp3lame -qscale:a 4 public/audio/breathe-in.mp3
ffmpeg -i /tmp/hold.aiff -codec:a libmp3lame -qscale:a 4 public/audio/hold.mp3
ffmpeg -i /tmp/breathe-out.aiff -codec:a libmp3lame -qscale:a 4 public/audio/breathe-out.mp3
```

### Anti-Patterns to Avoid
- **Creating AudioContext on page load:** iOS requires context creation/resume within a user gesture. Howler handles this, but never call `new Howl({ autoplay: true })` without a preceding user interaction.
- **Using `HTMLAudioElement.play()` for voice cues:** Has higher latency than Web Audio API (Howler defaults to Web Audio). Only use HTML5 Audio mode for long-form streaming.
- **Stopping and restarting music on toggle:** Violates D-04. Always mute/unmute.
- **Tight-coupling audio to animation keyframes:** Animation uses `onfinish` recursion which is subject to frame timing drift. Use independent setTimeout scheduling from the same config values for audio -- the two systems run in parallel, not coupled.
- **Preloading audio on component mount without user gesture:** On iOS, audio decoding may fail or be deferred until user interaction. Call `ensureLoaded()` just before first play (within gesture handler).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| iOS audio autoplay unlock | Custom AudioContext.resume() with gesture detection | Howler.js auto-unlock | [CITED: howler.js README] Handles touchend/click detection, silent buffer trick, edge cases across iOS versions |
| Cross-browser audio format | Format detection + fallback logic | Howler.js multi-src | Howler tries sources in order, handles codec detection |
| Audio mute with position preserve | Custom GainNode management + playback tracking | `Howl.mute(bool)` | Single API call, handles internal state correctly |
| Looping background audio | Custom `onended` handler with seek(0) + play() | `Howl({ loop: true })` | Gapless loop handled by library, no manual seek management |
| TTS placeholder audio | Web Speech API runtime synthesis | Pre-generated MP3 files | Consistent, works offline, no runtime dependency on speech synthesis |

**Key insight:** Howler.js exists specifically to solve the iOS Safari audio problems this phase faces. Writing a custom Web Audio API wrapper would replicate 80% of what Howler already does, with higher risk of iOS-specific bugs.

## Common Pitfalls

### Pitfall 1: iOS AudioContext Suspended After Background/Lock
**What goes wrong:** If the user locks their phone or switches apps, iOS suspends the AudioContext. When they return, audio won't play even though the session is still "running."
**Why it happens:** iOS aggressively suspends audio contexts when the app is not in foreground.
**How to avoid:** Listen for `Howler.ctx.addEventListener('statechange', ...)` and call `Howler.ctx.resume()` on return. Alternatively, Howler.js handles this automatically in most cases with its internal unlock mechanism.
**Warning signs:** Audio stops but animation continues after returning from background.

### Pitfall 2: Timer Drift Between Animation and Audio
**What goes wrong:** After many cycles, setTimeout-based audio cues drift relative to the Web Animations API keyframes.
**Why it happens:** setTimeout is not guaranteed to fire at exact intervals; animation timing uses a different clock.
**How to avoid:** Re-align at each cycle boundary. The architecture already does this: both `startCycle()` (animation) and `scheduleCycle()` (audio) reset their scheduling independently at the end of each cycle, so drift only accumulates within a single cycle (max ~15 seconds), which is imperceptible.
**Warning signs:** Cues fire noticeably before/after visible phase transitions after extended sessions.

### Pitfall 3: Workbox Not Caching Audio Files
**What goes wrong:** App works online but audio fails offline because MP3 files aren't in the precache manifest.
**Why it happens:** Current `globPatterns` only matches `js,css,html,ico,png,svg,woff2` -- not `mp3`.
**How to avoid:** Add `mp3` to the workbox globPatterns in `vite.config.ts`.
**Warning signs:** Audio 404s when testing offline/airplane mode.

### Pitfall 4: Hold Phase Cue When Hold=0
**What goes wrong:** "Hold your breath" cue plays even when hold duration is 0 seconds.
**Why it happens:** Scheduling code doesn't check for hold=0 edge case.
**How to avoid:** Conditionally skip the hold cue scheduling when `config.hold === 0` (same pattern as the animation hook which already skips the hold keyframe).
**Warning signs:** Hearing "hold your breath" when only inhale/exhale are configured.

### Pitfall 5: Multiple Howl Instances Playing After Rapid Start/Stop
**What goes wrong:** Rapidly tapping start/stop creates overlapping audio playback.
**Why it happens:** Stop handler doesn't fully clear all scheduled timeouts or stop all playing sounds before start creates new ones.
**How to avoid:** In `stop()`, call `clearTimeout` on all stored timer IDs AND call `.stop()` on all Howl instances. In `start()`, call `stop()` first as a safety measure.
**Warning signs:** Multiple voice cues playing simultaneously, music volume doubling.

## Code Examples

### Workbox Configuration Update (Required)
```typescript
// Source: [VERIFIED: existing vite.config.ts + workbox docs pattern]
// In vite.config.ts, update workbox globPatterns:
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp3}'],
  cleanupOutdatedCaches: true,
},
```

### Reducer Extension for Music Toggle
```typescript
// Source: Derived from existing breathingReducer pattern in src/hooks/useBreathingAnimation.ts
export type BreathingAction =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'SET_INHALE'; value: number }
  | { type: 'SET_HOLD'; value: number }
  | { type: 'SET_EXHALE'; value: number }
  | { type: 'TOGGLE_MUSIC' };  // NEW

export interface BreathingState {
  session: SessionState;
  config: BreathingConfig;
  musicEnabled: boolean;  // NEW
}

// In reducer:
case 'TOGGLE_MUSIC':
  return { ...state, musicEnabled: !state.musicEnabled };
```

### MusicToggle Component
```typescript
// Source: D-01, D-02 from CONTEXT.md
interface MusicToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function MusicToggle({ enabled, onToggle }: MusicToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={enabled ? 'Mute background music' : 'Unmute background music'}
      aria-pressed={enabled}
      className="absolute bottom-8 right-8 w-10 h-10 flex items-center justify-center text-white/70 active:text-white"
    >
      {enabled ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
    </button>
  );
}
```

### Testing Pattern: Mocking Howler.js in Vitest
```typescript
// Source: [ASSUMED] Standard vitest mock pattern for ES module libraries
// In test file or setup:
vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    stop: vi.fn(),
    mute: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    unload: vi.fn(),
  })),
  Howler: {
    ctx: { state: 'running', resume: vi.fn() },
    autoUnlock: true,
  },
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `new Audio().play()` with callbacks | Web Audio API via AudioContext | 2016+ | Lower latency, precise timing, but requires user gesture |
| Manual iOS audio unlock (silent video trick) | Howler.js autoUnlock (silent buffer on touchend) | Howler 2.x | No need for manual unlock code |
| `webkitAudioContext` prefix | Standard `AudioContext` | Safari 14.1+ (2021) | No prefix needed for modern iOS |
| `Howler.autoSuspend = false` workaround | Default behavior works | Howler 2.2+ | Context suspension handled automatically |

**Deprecated/outdated:**
- `webkitAudioContext`: Not needed -- standard `AudioContext` works on all target iOS versions (Safari 15.4+)
- `NoSleep.js` for audio: Only needed for wake lock (Phase 4), not audio unlock
- Callback-based `decodeAudioData`: Promise-based version supported everywhere now

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | macOS `say -v Samantha` produces acceptable placeholder audio quality | Architecture Patterns (Pattern 4) | LOW - can use any other voice or online TTS tool |
| A2 | Howler.js vi.mock pattern works with vitest + ESM | Code Examples (Testing) | MEDIUM - may need `vi.hoisted()` or manual mock in `__mocks__/` directory |
| A3 | Ocean waves placeholder can be a short (10-30s) royalty-free loop file sourced online or generated | Common Pitfalls / Don't Hand-Roll | LOW - any looping ambient audio works for placeholder |
| A4 | 800ms initial delay (D-09) feels natural as "settling" pause | Architecture Patterns | LOW - easily tuned constant |

## Open Questions

1. **Ocean waves placeholder source**
   - What we know: Need a royalty-free MP3 loop for background music placeholder (D-13)
   - What's unclear: Where to source it -- generate with synthesis, download from freesound.org, or use a short silent/tone file as pure placeholder
   - Recommendation: Download a short (~15-30s) royalty-free ocean loop from freesound.org, or generate white noise filtered to sound ocean-like with ffmpeg. Either works for development.

2. **Audio file size impact on PWA precache**
   - What we know: Voice cues will be <100KB each. Background music loop could be 200KB-1MB for 15-30s MP3.
   - What's unclear: Whether total precache size impacts first-load experience meaningfully.
   - Recommendation: Keep background music placeholder short (~15s loop, ~200KB at 128kbps). This is well within acceptable precache budgets.

3. **Exact initial delay value (D-09)**
   - What we know: Decision says "~0.5-1s"
   - What's unclear: Exact value that feels best
   - Recommendation: Start with 800ms as a constant. Easy to adjust later.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ffmpeg | Placeholder audio generation (AIFF to MP3) | Yes | 8.1 | -- |
| macOS `say` | TTS placeholder generation | Yes | System | -- |
| howler (npm) | Audio playback | Not yet installed | 2.2.4 (registry) | -- |
| @types/howler (npm) | TypeScript types | Not yet installed | 2.2.12 (registry) | -- |

**Missing dependencies with no fallback:**
- None -- all dependencies are installable or already available

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRTH-09 | "Breathe in" plays at inhale start | unit | `npx vitest run src/__tests__/breathing-audio.test.ts -t "breathe in"` | No - Wave 0 |
| BRTH-10 | "Hold" plays at hold start | unit | `npx vitest run src/__tests__/breathing-audio.test.ts -t "hold"` | No - Wave 0 |
| BRTH-11 | "Breathe out" plays at exhale start | unit | `npx vitest run src/__tests__/breathing-audio.test.ts -t "breathe out"` | No - Wave 0 |
| BRTH-12 | Music toggle on/off | unit | `npx vitest run src/__tests__/breathing-audio.test.ts -t "music toggle"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/breathing-audio.test.ts` -- covers BRTH-09, BRTH-10, BRTH-11, BRTH-12
- [ ] Howler.js mock setup (either in test file or `src/__mocks__/howler.ts`)
- [ ] Framework install: `npm install howler && npm install -D @types/howler`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | -- |
| V3 Session Management | No | -- |
| V4 Access Control | No | -- |
| V5 Input Validation | No | No user input processed -- only pre-defined audio files |
| V6 Cryptography | No | -- |

No security concerns for this phase. Audio files are static assets served from the same origin. No user-supplied data is processed. No network requests beyond initial asset load (which is handled by service worker precaching over HTTPS).

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] howler v2.2.4, @types/howler v2.2.12
- [CITED: github.com/goldfire/howler.js README] iOS mobile unlock, mute/unmute, loop, constructor options, Howler global
- [CITED: developer.mozilla.org/Web/API/Web_Audio_API] AudioContext lifecycle, decodeAudioData, GainNode
- [CITED: developer.mozilla.org/Web/API/AudioContext] Suspended state, resume(), user gesture requirement
- [CITED: developer.chrome.com/blog/web-audio-autoplay] Context stays resumed after initial gesture, automatic resumption behavior
- [CITED: webkit.org/blog/6784/new-video-policies-for-ios] iOS gesture definition -- must be in touchend/click/keydown handler

### Secondary (MEDIUM confidence)
- [VERIFIED: local system] ffmpeg 8.1, macOS `say` command with Samantha voice available
- [VERIFIED: existing codebase] useBreathingAnimation hook pattern, breathingReducer, configRef pattern, workbox globPatterns

### Tertiary (LOW confidence)
- [ASSUMED] vitest mock pattern for Howler.js ESM module

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Howler.js is well-documented, verified on npm, explicitly handles all D-XX requirements
- Architecture: HIGH - Follows established project patterns (custom hook, reducer), clear integration points identified
- Pitfalls: HIGH - iOS audio issues are well-documented, workbox gap verified in config

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (stable domain -- Web Audio API and Howler.js are mature)
