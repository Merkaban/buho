export type SessionState = 'idle' | 'running';

export interface BreathingConfig {
  inhale: number; // seconds (min: 1, max: 60)
  hold: number;   // seconds (min: 0, max: 60) -- 0 means skip hold phase
  exhale: number; // seconds (min: 1, max: 60)
}

export interface BreathingState {
  session: SessionState;
  config: BreathingConfig;
  musicEnabled: boolean;
}

export type BreathingAction =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'SET_INHALE'; value: number }
  | { type: 'SET_HOLD'; value: number }
  | { type: 'SET_EXHALE'; value: number }
  | { type: 'TOGGLE_MUSIC' };

export const DEFAULT_CONFIG: BreathingConfig = {
  inhale: 5,
  hold: 5,
  exhale: 5,
};

export const MIN_SECONDS = { inhale: 1, hold: 0, exhale: 1 };
export const MAX_SECONDS = { inhale: 60, hold: 60, exhale: 60 };
