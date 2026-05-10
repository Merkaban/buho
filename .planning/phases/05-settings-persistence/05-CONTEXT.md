---
phase: 05-settings-persistence
created: 2026-05-10
decisions: 6
deferred: 0
---

<domain>
On-screen controls for breathing timing + optional session duration timer + localStorage persistence of all settings.
</domain>

<decisions>

### Session Duration Timer
- **Stepper control** matching existing inhale/hold/exhale pattern (+/- buttons)
- **Unit: minutes** (not seconds)
- **Default: 5 minutes**
- **0 = no timer** (infinite session, same as current behavior) — mirrors `hold: 0` = "skip hold" pattern
- **Step size: 1 minute**
- **Max: TBD by research** (reasonable upper bound, e.g., 30 or 60 min)

### Countdown Display
- Small, unobtrusive text **centered below the breathing circle**
- Only visible during an active session when duration > 0
- Shows remaining time counting down
- Format: research can determine (e.g., "5:00" or "5 min")

### Controls Layout
- Duration picker placed **below** the existing timing steppers (inhale/hold/exhale row)
- Same visual style as existing steppers
- All controls fade out when session starts (existing behavior)

### Session End Behavior
- When countdown reaches 0: auto-stop session (same as tapping stop — dispatch STOP, stop animation, stop audio, release wake lock)
- Return to idle state with glowing small white circle (default resting state)

### Persistence
- **Persist everything as last-used values** via localStorage
- Scope: inhale, hold, exhale, musicEnabled, duration
- Load persisted values on app startup (replace DEFAULT_CONFIG if values exist)
- No reset-to-defaults button needed (user can just set back manually)

### Controls Visibility
- All controls (timing steppers + duration stepper + music toggle) visible only in idle state
- Countdown display visible only in running state (when duration > 0)

</decisions>

<code_context>

### Reusable Assets
- `TimingControls.tsx` — Stepper component with label/value/min/max/onChange pattern (reuse for duration)
- `BreathingConfig` type in `src/types/breathing.ts` — extend with `duration: number`
- `breathingReducer` in `useBreathingAnimation` — add `SET_DURATION` action
- `handleCircleTap` in `BreathingScreen.tsx` — integration point for timer start/stop
- Fade in/out with `opacity-100`/`opacity-0 pointer-events-none` transition pattern

### Integration Points
- Timer countdown must coordinate with `state.session` — start on START, clear on STOP
- Wake lock release must happen on auto-stop (same as manual stop)
- Audio stop must happen on auto-stop (same as manual stop)
- `configRef` pattern in useBreathingAnimation enables mid-session awareness (timer can read config.duration)

</code_context>

<canonical_refs>
- src/types/breathing.ts (BreathingConfig, BreathingAction, DEFAULT_CONFIG, MIN/MAX constants)
- src/components/TimingControls.tsx (Stepper component pattern to reuse)
- src/components/BreathingScreen.tsx (integration hub — state, dispatch, handleCircleTap)
- src/hooks/useBreathingAnimation.ts (breathingReducer, configRef pattern)
</canonical_refs>
