import { describe, it, expect, beforeEach, vi } from 'vitest';
import { breathingReducer } from '../hooks/useBreathingAnimation';
import { DEFAULT_CONFIG } from '../types/breathing';
import { loadSettings, saveSettings } from '../hooks/useSettings';
import type { BreathingState } from '../types/breathing';

const initialState: BreathingState = {
  session: 'idle',
  config: { ...DEFAULT_CONFIG },
  musicEnabled: true,
};

describe('SET_DURATION reducer (SETT-01)', () => {
  it('sets config.duration to action.value', () => {
    const result = breathingReducer(initialState, { type: 'SET_DURATION', value: 10 });
    expect(result.config.duration).toBe(10);
  });

  it('is ignored when session is running', () => {
    const running: BreathingState = { ...initialState, session: 'running' };
    const result = breathingReducer(running, { type: 'SET_DURATION', value: 10 });
    expect(result.config.duration).toBe(5); // remains default
  });

  it('clamps value to min 0', () => {
    const result = breathingReducer(initialState, { type: 'SET_DURATION', value: -5 });
    expect(result.config.duration).toBe(0);
  });

  it('clamps value to max 30', () => {
    const result = breathingReducer(initialState, { type: 'SET_DURATION', value: 99 });
    expect(result.config.duration).toBe(30);
  });
});

describe('Settings persistence (SETT-02)', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    });
  });

  describe('loadSettings', () => {
    it('returns DEFAULT with duration:5 when localStorage is empty', () => {
      const result = loadSettings();
      expect(result.config).toEqual(DEFAULT_CONFIG);
      expect(result.config.duration).toBe(5);
      expect(result.musicEnabled).toBe(true);
    });

    it('returns parsed values when localStorage has valid JSON', () => {
      const stored = {
        config: { inhale: 3, holdIn: 2, exhale: 4, holdOut: 3, duration: 15 },
        musicEnabled: false,
      };
      localStorage.setItem('buho-settings', JSON.stringify(stored));
      const result = loadSettings();
      expect(result.config.inhale).toBe(3);
      expect(result.config.holdIn).toBe(2);
      expect(result.config.exhale).toBe(4);
      expect(result.config.holdOut).toBe(3);
      expect(result.config.duration).toBe(15);
      expect(result.musicEnabled).toBe(false);
    });

    it('returns DEFAULT when localStorage has corrupt JSON', () => {
      localStorage.setItem('buho-settings', 'not-json{{{');
      const result = loadSettings();
      expect(result.config).toEqual(DEFAULT_CONFIG);
      expect(result.musicEnabled).toBe(true);
    });
  });

  describe('saveSettings', () => {
    it('writes JSON to localStorage under key "buho-settings"', () => {
      const config = { inhale: 4, hold: 3, exhale: 6, duration: 10 };
      saveSettings(config, false);
      const stored = localStorage.getItem('buho-settings');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.config).toEqual(config);
      expect(parsed.musicEnabled).toBe(false);
    });

    it('includes config.duration and musicEnabled in stored JSON', () => {
      const config = { inhale: 5, hold: 5, exhale: 5, duration: 20 };
      saveSettings(config, true);
      const stored = localStorage.getItem('buho-settings');
      const parsed = JSON.parse(stored!);
      expect(parsed.config.duration).toBe(20);
      expect(parsed.musicEnabled).toBe(true);
    });
  });
});
