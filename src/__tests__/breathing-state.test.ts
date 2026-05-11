import { describe, it, expect } from 'vitest';
import { breathingReducer } from '../hooks/useBreathingAnimation';
import { DEFAULT_CONFIG } from '../types/breathing';
import type { BreathingState } from '../types/breathing';

const initialState: BreathingState = {
  session: 'idle',
  config: { ...DEFAULT_CONFIG },
  musicEnabled: true,
};

describe('Breathing State Reducer (BRTH-01, BRTH-02, BRTH-03, BRTH-04, BRTH-05)', () => {
  describe('session control', () => {
    it('START transitions from idle to running (BRTH-04)', () => {
      const result = breathingReducer(initialState, { type: 'START' });
      expect(result.session).toBe('running');
    });

    it('STOP transitions from running to idle (BRTH-05)', () => {
      const running: BreathingState = { ...initialState, session: 'running' };
      const result = breathingReducer(running, { type: 'STOP' });
      expect(result.session).toBe('idle');
    });

    it('START while already running is a no-op', () => {
      const running: BreathingState = { ...initialState, session: 'running' };
      const result = breathingReducer(running, { type: 'START' });
      expect(result).toBe(running);
    });

    it('STOP while already idle is a no-op', () => {
      const result = breathingReducer(initialState, { type: 'STOP' });
      expect(result).toBe(initialState);
    });
  });

  describe('inhale configuration (BRTH-01)', () => {
    it('SET_INHALE updates inhale duration', () => {
      const result = breathingReducer(initialState, { type: 'SET_INHALE', value: 8 });
      expect(result.config.inhale).toBe(8);
    });

    it('SET_INHALE is ignored while running', () => {
      const running: BreathingState = { ...initialState, session: 'running' };
      const result = breathingReducer(running, { type: 'SET_INHALE', value: 8 });
      expect(result.config.inhale).toBe(5);
    });

    it('SET_INHALE clamps to minimum 1', () => {
      const result = breathingReducer(initialState, { type: 'SET_INHALE', value: 0 });
      expect(result.config.inhale).toBe(1);
    });

    it('SET_INHALE clamps to maximum 60', () => {
      const result = breathingReducer(initialState, { type: 'SET_INHALE', value: 99 });
      expect(result.config.inhale).toBe(60);
    });
  });

  describe('hold configuration (BRTH-02)', () => {
    it('SET_HOLD_IN updates holdIn duration', () => {
      const result = breathingReducer(initialState, { type: 'SET_HOLD_IN', value: 7 });
      expect(result.config.holdIn).toBe(7);
    });

    it('SET_HOLD_IN allows 0 to skip hold phase (D-07)', () => {
      const result = breathingReducer(initialState, { type: 'SET_HOLD_IN', value: 0 });
      expect(result.config.holdIn).toBe(0);
    });

    it('SET_HOLD_IN is ignored while running', () => {
      const running: BreathingState = { ...initialState, session: 'running' };
      const result = breathingReducer(running, { type: 'SET_HOLD_IN', value: 3 });
      expect(result.config.holdIn).toBe(5);
    });

    it('SET_HOLD_IN clamps to maximum 60', () => {
      const result = breathingReducer(initialState, { type: 'SET_HOLD_IN', value: 99 });
      expect(result.config.holdIn).toBe(60);
    });
  });

  describe('hold-out configuration', () => {
    it('SET_HOLD_OUT updates holdOut duration', () => {
      const result = breathingReducer(initialState, { type: 'SET_HOLD_OUT', value: 7 });
      expect(result.config.holdOut).toBe(7);
    });

    it('SET_HOLD_OUT allows 0 to skip hold-out phase', () => {
      const result = breathingReducer(initialState, { type: 'SET_HOLD_OUT', value: 0 });
      expect(result.config.holdOut).toBe(0);
    });

    it('SET_HOLD_OUT is ignored while running', () => {
      const running: BreathingState = { ...initialState, session: 'running' };
      const result = breathingReducer(running, { type: 'SET_HOLD_OUT', value: 3 });
      expect(result.config.holdOut).toBe(0);
    });

    it('SET_HOLD_OUT clamps to maximum 60', () => {
      const result = breathingReducer(initialState, { type: 'SET_HOLD_OUT', value: 99 });
      expect(result.config.holdOut).toBe(60);
    });
  });

  describe('exhale configuration (BRTH-03)', () => {
    it('SET_EXHALE updates exhale duration', () => {
      const result = breathingReducer(initialState, { type: 'SET_EXHALE', value: 6 });
      expect(result.config.exhale).toBe(6);
    });

    it('SET_EXHALE is ignored while running', () => {
      const running: BreathingState = { ...initialState, session: 'running' };
      const result = breathingReducer(running, { type: 'SET_EXHALE', value: 6 });
      expect(result.config.exhale).toBe(5);
    });

    it('SET_EXHALE clamps to minimum 1', () => {
      const result = breathingReducer(initialState, { type: 'SET_EXHALE', value: 0 });
      expect(result.config.exhale).toBe(1);
    });

    it('SET_EXHALE clamps to maximum 60', () => {
      const result = breathingReducer(initialState, { type: 'SET_EXHALE', value: 99 });
      expect(result.config.exhale).toBe(60);
    });
  });
});
