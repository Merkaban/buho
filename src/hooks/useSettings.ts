import type { BreathingConfig } from '../types/breathing';
import { DEFAULT_CONFIG, MIN_SECONDS, MAX_SECONDS, MIN_DURATION, MAX_DURATION } from '../types/breathing';

const STORAGE_KEY = 'mindfulone-settings';

interface PersistedSettings {
  config: BreathingConfig;
  musicEnabled: boolean;
}

function clampConfig(raw: Partial<BreathingConfig>): BreathingConfig {
  return {
    inhale: Math.max(MIN_SECONDS.inhale, Math.min(MAX_SECONDS.inhale, raw.inhale ?? DEFAULT_CONFIG.inhale)),
    hold: Math.max(MIN_SECONDS.hold, Math.min(MAX_SECONDS.hold, raw.hold ?? DEFAULT_CONFIG.hold)),
    exhale: Math.max(MIN_SECONDS.exhale, Math.min(MAX_SECONDS.exhale, raw.exhale ?? DEFAULT_CONFIG.exhale)),
    duration: Math.max(MIN_DURATION, Math.min(MAX_DURATION, raw.duration ?? DEFAULT_CONFIG.duration)),
  };
}

export function loadSettings(): { config: BreathingConfig; musicEnabled: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { config: { ...DEFAULT_CONFIG }, musicEnabled: true };
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      config: clampConfig(parsed.config || {}),
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
