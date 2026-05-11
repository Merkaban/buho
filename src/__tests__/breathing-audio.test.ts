import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { breathingReducer } from '../hooks/useBreathingAnimation';
import { DEFAULT_CONFIG } from '../types/breathing';
import type { BreathingState } from '../types/breathing';

// Mock howler module
const mockPlay = vi.fn().mockReturnValue(1);
const mockStop = vi.fn();
const mockMute = vi.fn();
const mockUnload = vi.fn();

vi.mock('howler', () => {
  const MockHowl = vi.fn(function (this: Record<string, unknown>) {
    this.play = mockPlay;
    this.stop = mockStop;
    this.mute = mockMute;
    this.on = vi.fn();
    this.once = vi.fn();
    this.unload = mockUnload;
  });
  return {
    Howl: MockHowl,
    Howler: {
      ctx: { state: 'running', resume: vi.fn() },
      autoUnlock: true,
    },
  };
});

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
    mockPlay.mockClear();
    mockStop.mockClear();
    mockMute.mockClear();
    mockUnload.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('breathe in cue plays after initial 800ms delay (D-09, BRTH-09)', async () => {
    const { useBreathingAudio } = await import('../hooks/useBreathingAudio');
    const { result } = renderHook(() => useBreathingAudio());

    act(() => {
      result.current.start({ inhale: 4, holdIn: 4, exhale: 4, holdOut: 0, duration: 5 });
    });

    // Before 800ms -- no cue yet
    act(() => { vi.advanceTimersByTime(799); });
    // play is called once for music.play() on start
    const callsBeforeCue = mockPlay.mock.calls.length;

    // At 800ms -- "breathe in" cue fires
    act(() => { vi.advanceTimersByTime(1); });
    expect(mockPlay.mock.calls.length).toBe(callsBeforeCue + 1);

    act(() => { result.current.stop(); });
  });

  it('hold cue plays at inhale offset (BRTH-10)', async () => {
    const { useBreathingAudio } = await import('../hooks/useBreathingAudio');
    const { result } = renderHook(() => useBreathingAudio());

    act(() => {
      mockPlay.mockClear();
      result.current.start({ inhale: 4, holdIn: 4, exhale: 4, holdOut: 0, duration: 5 });
    });

    // Advance to 800ms (breathe in) + 4000ms (inhale duration) = 4800ms
    act(() => { vi.advanceTimersByTime(4800); });

    // Should have calls for: music.play(), breathe-in.play(), hold.play()
    expect(mockPlay.mock.calls.length).toBeGreaterThanOrEqual(3);

    act(() => { result.current.stop(); });
  });

  it('breathe out cue plays at inhale+hold offset (BRTH-11)', async () => {
    const { useBreathingAudio } = await import('../hooks/useBreathingAudio');
    const { result } = renderHook(() => useBreathingAudio());

    act(() => {
      mockPlay.mockClear();
      result.current.start({ inhale: 4, holdIn: 4, exhale: 4, holdOut: 0, duration: 5 });
    });

    // Advance to 800ms + (inhale + hold) * 1000 = 800 + 8000 = 8800ms
    act(() => { vi.advanceTimersByTime(8800); });

    // Should have calls for: music.play(), breathe-in.play(), hold.play(), breathe-out.play()
    expect(mockPlay.mock.calls.length).toBeGreaterThanOrEqual(4);

    act(() => { result.current.stop(); });
  });

  it('hold cue is skipped when holdIn=0 (Pitfall 4)', async () => {
    const { useBreathingAudio } = await import('../hooks/useBreathingAudio');
    const { result } = renderHook(() => useBreathingAudio());

    act(() => {
      mockPlay.mockClear();
      result.current.start({ inhale: 4, holdIn: 0, exhale: 4, holdOut: 0, duration: 5 });
    });

    // Advance through full first cycle: 800ms + (4+0+4)*1000 = 8800ms
    act(() => { vi.advanceTimersByTime(8800); });

    // With hold=0: should only have music.play(), breathe-in.play(), breathe-out.play() = 3
    // NOT 4 (no hold.play())
    expect(mockPlay.mock.calls.length).toBe(3);

    act(() => { result.current.stop(); });
  });

  it('hold cue is skipped when holdIn=1 (too short for cue)', async () => {
    const { useBreathingAudio } = await import('../hooks/useBreathingAudio');
    const { result } = renderHook(() => useBreathingAudio());

    act(() => {
      mockPlay.mockClear();
      result.current.start({ inhale: 4, holdIn: 1, exhale: 4, holdOut: 0, duration: 5 });
    });

    // Advance through full first cycle: 800ms + (4+1+4)*1000 = 9800ms
    act(() => { vi.advanceTimersByTime(9800); });

    // holdIn=1 is too short for a cue: music.play(), breathe-in.play(), breathe-out.play() = 3
    expect(mockPlay.mock.calls.length).toBe(3);

    act(() => { result.current.stop(); });
  });

  it('hold cue plays for holdOut when holdOut > 1', async () => {
    const { useBreathingAudio } = await import('../hooks/useBreathingAudio');
    const { result } = renderHook(() => useBreathingAudio());

    act(() => {
      mockPlay.mockClear();
      result.current.start({ inhale: 4, holdIn: 0, exhale: 4, holdOut: 3, duration: 5 });
    });

    // Advance through full first cycle: 800ms + (4+0+4+3)*1000 = 11800ms
    act(() => { vi.advanceTimersByTime(11800); });

    // music.play(), breathe-in.play(), breathe-out.play(), hold.play() (for holdOut) = 4
    expect(mockPlay.mock.calls.length).toBe(4);

    act(() => { result.current.stop(); });
  });
});

describe('Breathing Audio - Music Toggle (BRTH-12)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPlay.mockClear();
    mockStop.mockClear();
    mockMute.mockClear();
    mockUnload.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('toggleMusic(false) mutes without stopping (D-04)', async () => {
    const { useBreathingAudio } = await import('../hooks/useBreathingAudio');
    const { result } = renderHook(() => useBreathingAudio());

    act(() => {
      result.current.start({ inhale: 4, holdIn: 4, exhale: 4, holdOut: 0, duration: 5 });
    });

    act(() => {
      result.current.toggleMusic(false);
    });

    // mute(true) should be called -- muting without stopping
    expect(mockMute).toHaveBeenCalledWith(true);
    // stop should NOT have been called for the toggle action
    expect(mockStop).not.toHaveBeenCalled();

    act(() => { result.current.stop(); });
  });

  it('toggleMusic(true) unmutes and resumes position (D-04)', async () => {
    const { useBreathingAudio } = await import('../hooks/useBreathingAudio');
    const { result } = renderHook(() => useBreathingAudio());

    act(() => {
      result.current.start({ inhale: 4, holdIn: 4, exhale: 4, holdOut: 0, duration: 5 });
    });

    act(() => {
      result.current.toggleMusic(false);
    });
    mockMute.mockClear();

    act(() => {
      result.current.toggleMusic(true);
    });

    // mute(false) should be called -- unmuting preserves position
    expect(mockMute).toHaveBeenCalledWith(false);

    act(() => { result.current.stop(); });
  });

  it('stop() cuts all audio immediately (D-10)', async () => {
    const { useBreathingAudio } = await import('../hooks/useBreathingAudio');
    const { result } = renderHook(() => useBreathingAudio());

    act(() => {
      result.current.start({ inhale: 4, holdIn: 4, exhale: 4, holdOut: 0, duration: 5 });
    });

    act(() => {
      result.current.stop();
    });

    // stop() should be called on all Howl instances (music + 3 cues = 4 calls)
    expect(mockStop.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
});
