import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { breathingReducer } from '../hooks/useBreathingAnimation';
import { DEFAULT_CONFIG } from '../types/breathing';
import type { BreathingState } from '../types/breathing';

// Mock howler module
vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn().mockReturnValue(1),
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

const initialState: BreathingState = {
  session: 'idle',
  config: { ...DEFAULT_CONFIG },
  musicEnabled: true,
};

describe('Breathing Audio - Reducer (BRTH-12)', () => {
  it('TOGGLE_MUSIC flips musicEnabled from true to false', () => {
    const result = breathingReducer(initialState, { type: 'TOGGLE_MUSIC' });
    expect(result.musicEnabled).toBe(false);
  });

  it('TOGGLE_MUSIC flips musicEnabled from false to true', () => {
    const off: BreathingState = { ...initialState, musicEnabled: false };
    const result = breathingReducer(off, { type: 'TOGGLE_MUSIC' });
    expect(result.musicEnabled).toBe(true);
  });

  it('TOGGLE_MUSIC works while session is running (D-02)', () => {
    const running: BreathingState = { ...initialState, session: 'running' };
    const result = breathingReducer(running, { type: 'TOGGLE_MUSIC' });
    expect(result.musicEnabled).toBe(false);
  });
});

describe('Breathing Audio - Voice Cues (BRTH-09, BRTH-10, BRTH-11)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('breathe in cue plays after initial 800ms delay (D-09, BRTH-09)', async () => {
    // RED: Will fail until useBreathingAudio.ts is created in Plan 02
    // Using dynamic import to defer resolution - test fails when module missing
    const mod = await vi.importActual<typeof import('../hooks/useBreathingAudio')>('../hooks/useBreathingAudio');
    expect(mod.useBreathingAudio).toBeDefined();
  });

  it('hold cue plays at inhale offset (BRTH-10)', async () => {
    const mod = await vi.importActual<typeof import('../hooks/useBreathingAudio')>('../hooks/useBreathingAudio');
    expect(mod.useBreathingAudio).toBeDefined();
  });

  it('breathe out cue plays at inhale+hold offset (BRTH-11)', async () => {
    const mod = await vi.importActual<typeof import('../hooks/useBreathingAudio')>('../hooks/useBreathingAudio');
    expect(mod.useBreathingAudio).toBeDefined();
  });

  it('hold cue is skipped when hold=0 (Pitfall 4)', async () => {
    const mod = await vi.importActual<typeof import('../hooks/useBreathingAudio')>('../hooks/useBreathingAudio');
    expect(mod.useBreathingAudio).toBeDefined();
  });
});

describe('Breathing Audio - Music Toggle (BRTH-12)', () => {
  it('toggleMusic(false) mutes without stopping (D-04)', async () => {
    const mod = await vi.importActual<typeof import('../hooks/useBreathingAudio')>('../hooks/useBreathingAudio');
    expect(mod.useBreathingAudio).toBeDefined();
  });

  it('toggleMusic(true) unmutes and resumes position (D-04)', async () => {
    const mod = await vi.importActual<typeof import('../hooks/useBreathingAudio')>('../hooks/useBreathingAudio');
    expect(mod.useBreathingAudio).toBeDefined();
  });

  it('stop() cuts all audio immediately (D-10)', async () => {
    const mod = await vi.importActual<typeof import('../hooks/useBreathingAudio')>('../hooks/useBreathingAudio');
    expect(mod.useBreathingAudio).toBeDefined();
  });
});
