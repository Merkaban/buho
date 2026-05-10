import type { BreathingConfig } from '../types/breathing';
import { DEFAULT_CONFIG } from '../types/breathing';

const STORAGE_KEY = 'mindfulone-settings';

interface PersistedSettings {
  config: BreathingConfig;
  musicEnabled: boolean;
}

export function loadSettings(): { config: BreathingConfig; musicEnabled: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { config: { ...DEFAULT_CONFIG }, musicEnabled: true };
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
      musicEnabled: parsed.musicEnabled ?? true,
    };
  } catch {
    return { config: { ...DEFAULT_CONFIG }, musicEnabled: true };
  }
}

export function saveSettings(config: BreathingConfig, musicEnabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, musicEnabled }));
  } catch {
    // localStorage full or unavailable -- silently ignore
  }
}
