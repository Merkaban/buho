export type SessionState = 'idle' | 'running';

export interface BreathingConfig {
  inhale: number;  // seconds (min: 1, max: 60)
  holdIn: number;  // seconds (min: 0, max: 60) -- 0 means skip hold after inhale
  exhale: number;  // seconds (min: 1, max: 60)
  holdOut: number; // seconds (min: 0, max: 60) -- 0 means skip hold after exhale
  duration: number; // minutes (min: 0, max: 30) -- 0 means infinite
}

export interface BreathingState {
  session: SessionState;
  config: BreathingConfig;
  musicEnabled: boolean;
  voiceEnabled: boolean;
}

export type BreathingAction =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'SET_INHALE'; value: number }
  | { type: 'SET_HOLD_IN'; value: number }
  | { type: 'SET_EXHALE'; value: number }
  | { type: 'SET_HOLD_OUT'; value: number }
  | { type: 'SET_DURATION'; value: number }
  | { type: 'TOGGLE_MUSIC' }
  | { type: 'TOGGLE_VOICE' };

export const DEFAULT_CONFIG: BreathingConfig = {
  inhale: 5,
  holdIn: 5,
  exhale: 5,
  holdOut: 0,
  duration: 5,
};

export const MIN_SECONDS = { inhale: 1, holdIn: 0, holdOut: 0, exhale: 1 };
export const MAX_SECONDS = { inhale: 60, holdIn: 60, holdOut: 60, exhale: 60 };

export const MIN_DURATION = 0;
export const MAX_DURATION = 30;
