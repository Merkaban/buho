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
    case 'SET_HOLD_IN': {
      if (state.session === 'running') return state;
      const value = Math.max(MIN_SECONDS.holdIn, Math.min(MAX_SECONDS.holdIn, action.value));
      return { ...state, config: { ...state.config, holdIn: value } };
    }
    case 'SET_HOLD_OUT': {
      if (state.session === 'running') return state;
      const value = Math.max(MIN_SECONDS.holdOut, Math.min(MAX_SECONDS.holdOut, action.value));
      return { ...state, config: { ...state.config, holdOut: value } };
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

    const { inhale, holdIn, exhale, holdOut } = configRef.current;
    const total = inhale + holdIn + exhale + holdOut;
    if (total <= 0) return;

    const totalMs = total * 1000;
    const maxScale = 220 / 48;

    const keyframes: Keyframe[] = [
      { transform: 'scale(1)', offset: 0, easing: 'ease-in-out' },
    ];

    const inhaleEnd = inhale / total;
    keyframes.push({ transform: `scale(${maxScale})`, offset: inhaleEnd, easing: holdIn > 0 ? 'linear' : 'ease-in-out' });

    if (holdIn > 0) {
      const holdInEnd = (inhale + holdIn) / total;
      keyframes.push({ transform: `scale(${maxScale})`, offset: holdInEnd, easing: 'ease-in-out' });
    }

    const exhaleEnd = (inhale + holdIn + exhale) / total;
    keyframes.push({ transform: 'scale(1)', offset: exhaleEnd, easing: holdOut > 0 ? 'linear' : 'ease-in-out' });

    if (holdOut > 0) {
      keyframes.push({ transform: 'scale(1)', offset: 1 });
    } else {
      keyframes[keyframes.length - 1].offset = 1;
    }

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
