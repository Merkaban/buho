import { useRef, useCallback, useEffect } from 'react';
import type { BreathingState, BreathingAction, BreathingConfig } from '../types/breathing';
import { MIN_SECONDS, MAX_SECONDS, MIN_DURATION, MAX_DURATION } from '../types/breathing';

// --- Exported reducer (tested independently) ---
export function breathingReducer(state: BreathingState, action: BreathingAction): BreathingState {
  switch (action.type) {
    case 'START':
      if (state.session === 'running') return state;
      return { ...state, session: 'running' };
    case 'STOP':
      if (state.session === 'idle') return state;
      return { ...state, session: 'idle' };
    case 'SET_INHALE': {
      if (state.session === 'running') return state;
      const value = Math.max(MIN_SECONDS.inhale, Math.min(MAX_SECONDS.inhale, action.value));
      return { ...state, config: { ...state.config, inhale: value } };
    }
    case 'SET_HOLD': {
      if (state.session === 'running') return state;
      const value = Math.max(MIN_SECONDS.hold, Math.min(MAX_SECONDS.hold, action.value));
      return { ...state, config: { ...state.config, hold: value } };
    }
    case 'SET_EXHALE': {
      if (state.session === 'running') return state;
      const value = Math.max(MIN_SECONDS.exhale, Math.min(MAX_SECONDS.exhale, action.value));
      return { ...state, config: { ...state.config, exhale: value } };
    }
    case 'TOGGLE_MUSIC':
      return { ...state, musicEnabled: !state.musicEnabled };
    case 'SET_DURATION': {
      if (state.session === 'running') return state;
      const value = Math.max(MIN_DURATION, Math.min(MAX_DURATION, action.value));
      return { ...state, config: { ...state.config, duration: value } };
    }
    default:
      return state;
  }
}

// --- Animation hook ---
export function useBreathingAnimation() {
  const animationRef = useRef<Animation | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const configRef = useRef<BreathingConfig | null>(null);
  const runningRef = useRef(false);

  const startCycle = useCallback(() => {
    const el = elementRef.current;
    if (!el || !runningRef.current || !configRef.current) return;

    const { inhale, hold, exhale } = configRef.current;
    const totalMs = (inhale + hold + exhale) * 1000;
    const inhaleEnd = inhale / (inhale + hold + exhale);
    const holdEnd = inhaleEnd + hold / (inhale + hold + exhale);

    const maxScale = 220 / 48; // ~4.583 per D-01

    // Build keyframes — skip hold keyframe when hold=0 per D-07
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
      startCycle();
    };

    animationRef.current = anim;
  }, []);

  const start = useCallback((config: BreathingConfig) => {
    configRef.current = config;
    runningRef.current = true;
    startCycle();
  }, [startCycle]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (animationRef.current) {
      animationRef.current.onfinish = null;
      animationRef.current.cancel();
      animationRef.current = null;
    }
    if (elementRef.current) {
      elementRef.current.style.transform = 'scale(1)';
    }
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (animationRef.current) {
        animationRef.current.onfinish = null;
        animationRef.current.cancel();
        animationRef.current = null;
      }
    };
  }, []);

  return { elementRef, start, stop };
}
