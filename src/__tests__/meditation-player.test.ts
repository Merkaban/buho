import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { MeditationRecord } from '../types/meditation';

// ---------------------------------------------------------------------------
// Howler mock — see src/__tests__/breathing-audio.test.ts lines 1-29.
// We extend the breathing-audio scaffold with `seek`/`pause`, an `__instances`
// array so individual tests can capture the active Howl, and an `__triggerOnend`
// helper that invokes the `onend` callback the hook registered.
// ---------------------------------------------------------------------------
const mockPlay = vi.fn().mockReturnValue(1);
const mockStop = vi.fn();
const mockPause = vi.fn();
const mockUnload = vi.fn();
const mockSeek = vi.fn().mockReturnValue(0);
const mockOn = vi.fn();
const mockOnce = vi.fn();
const mockResume = vi.fn();

interface MockHowlInstance {
  play: typeof mockPlay;
  stop: typeof mockStop;
  pause: typeof mockPause;
  unload: typeof mockUnload;
  seek: typeof mockSeek;
  on: typeof mockOn;
  once: typeof mockOnce;
  __options: Record<string, unknown>;
  __triggerOnend: () => void;
}

const mockHowlInstances: MockHowlInstance[] = [];

vi.mock('howler', () => {
  const MockHowl = vi.fn(function (this: MockHowlInstance, opts: Record<string, unknown>) {
    this.play = mockPlay;
    this.stop = mockStop;
    this.pause = mockPause;
    this.unload = mockUnload;
    this.seek = mockSeek;
    this.on = mockOn;
    this.once = mockOnce;
    this.__options = opts;
    this.__triggerOnend = () => {
      const onend = opts.onend as (() => void) | undefined;
      if (onend) onend();
    };
    mockHowlInstances.push(this);
  });
  return {
    Howl: MockHowl,
    Howler: {
      ctx: { state: 'suspended', resume: mockResume },
      autoUnlock: true,
    },
  };
});

// ---------------------------------------------------------------------------
// useWakeLock mock — return stable references the tests can re-import and
// inspect. Re-exported as `wakeActivate` / `wakeRelease` for clarity.
// ---------------------------------------------------------------------------
const wakeActivate = vi.fn();
const wakeRelease = vi.fn();

vi.mock('../hooks/useWakeLock', () => ({
  useWakeLock: () => ({ activate: wakeActivate, release: wakeRelease }),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function makeRecord(overrides: Partial<MeditationRecord> = {}): MeditationRecord {
  return {
    id: 'rec-1',
    filename: 'morning_calm.mp3',
    duration: 754,
    blob: new Blob(['fake audio data'], { type: 'audio/mpeg' }),
    addedAt: 1_700_000_000_000,
    ...overrides,
  };
}

let createObjectURLMock: ReturnType<typeof vi.fn>;
let revokeObjectURLMock: ReturnType<typeof vi.fn>;
let urlCounter = 0;

beforeEach(() => {
  vi.useFakeTimers();
  mockPlay.mockClear();
  mockStop.mockClear();
  mockPause.mockClear();
  mockUnload.mockClear();
  mockSeek.mockReset();
  mockSeek.mockReturnValue(0);
  mockOn.mockClear();
  mockOnce.mockClear();
  mockResume.mockClear();
  wakeActivate.mockClear();
  wakeRelease.mockClear();
  mockHowlInstances.length = 0;

  urlCounter = 0;
  createObjectURLMock = vi.fn(() => `blob:test-${++urlCounter}`);
  revokeObjectURLMock = vi.fn();
  // Spy on the existing URL global rather than replacing it — Howler (and other
  // libs) may rely on `new URL(...)` for source parsing, and a wholesale stub
  // breaks that constructor.
  vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURLMock);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURLMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useMeditationPlayer', () => {
  // -------------------------------------------------------------------------
  // Test 1: play constructs Howl with correct options (D-17, Pitfall 4)
  // -------------------------------------------------------------------------
  it('play() constructs a Howl with format, html5:true, preload:true, blob URL src', async () => {
    const { useMeditationPlayer } = await import('../hooks/useMeditationPlayer');
    const { Howl } = await import('howler');

    const { result } = renderHook(() => useMeditationPlayer({ onEnd: vi.fn() }));

    act(() => {
      result.current.play(makeRecord({ filename: 'test.mp3' }));
    });

    expect(Howl).toHaveBeenCalledTimes(1);
    const callArgs = (Howl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArgs.format).toEqual(['mp3']);
    expect(callArgs.html5).toBe(true);
    expect(callArgs.preload).toBe(true);
    expect(Array.isArray(callArgs.src)).toBe(true);
    expect(typeof callArgs.src[0]).toBe('string');
    expect(callArgs.src[0].startsWith('blob:')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Test 2: play activates wake lock (D-16)
  // -------------------------------------------------------------------------
  it('play() activates the wake lock exactly once (D-16)', async () => {
    const { useMeditationPlayer } = await import('../hooks/useMeditationPlayer');
    const { result } = renderHook(() => useMeditationPlayer({ onEnd: vi.fn() }));

    act(() => {
      result.current.play(makeRecord());
    });

    expect(wakeActivate).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Test 3: play unlocks AudioContext when suspended (D-17 — iOS unlock)
  // -------------------------------------------------------------------------
  it('play() resumes the AudioContext when state !== "running" (D-17)', async () => {
    const { useMeditationPlayer } = await import('../hooks/useMeditationPlayer');
    const { result } = renderHook(() => useMeditationPlayer({ onEnd: vi.fn() }));

    act(() => {
      result.current.play(makeRecord());
    });

    expect(mockResume).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Test 4: pause toggles isPlaying and releases wake lock; does NOT unload
  // -------------------------------------------------------------------------
  it('pause() pauses howl, releases wake lock, and does NOT unload (D-14, D-16)', async () => {
    const { useMeditationPlayer } = await import('../hooks/useMeditationPlayer');
    const { result } = renderHook(() => useMeditationPlayer({ onEnd: vi.fn() }));

    act(() => {
      result.current.play(makeRecord());
    });
    expect(result.current.isPlaying).toBe(true);

    mockUnload.mockClear();
    act(() => {
      result.current.pause();
    });

    expect(mockPause).toHaveBeenCalledTimes(1);
    expect(wakeRelease).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
    // Resume must remain possible — Howl must NOT have been unloaded.
    expect(mockUnload).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Test 5: stop ordering — stop → unload → revokeObjectURL → wakeRelease
  // -------------------------------------------------------------------------
  it('stop() executes howl.stop → unload → revokeObjectURL → wakeRelease in order (D-14, D-16, Pattern 3)', async () => {
    const { useMeditationPlayer } = await import('../hooks/useMeditationPlayer');
    const { result } = renderHook(() => useMeditationPlayer({ onEnd: vi.fn() }));

    act(() => {
      result.current.play(makeRecord());
    });

    mockStop.mockClear();
    mockUnload.mockClear();
    revokeObjectURLMock.mockClear();
    wakeRelease.mockClear();

    act(() => {
      result.current.stop();
    });

    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(mockUnload).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
    expect(wakeRelease).toHaveBeenCalledTimes(1);

    const stopOrder = mockStop.mock.invocationCallOrder[0];
    const unloadOrder = mockUnload.mock.invocationCallOrder[0];
    const revokeOrder = revokeObjectURLMock.mock.invocationCallOrder[0];
    const releaseOrder = wakeRelease.mock.invocationCallOrder[0];

    expect(stopOrder).toBeLessThan(unloadOrder);
    expect(unloadOrder).toBeLessThan(revokeOrder);
    expect(revokeOrder).toBeLessThan(releaseOrder);
  });

  // -------------------------------------------------------------------------
  // Test 6: onend fires stop() + opts.onEnd() (D-15)
  // -------------------------------------------------------------------------
  it('Howl onend triggers stop() then opts.onEnd() (D-15)', async () => {
    const { useMeditationPlayer } = await import('../hooks/useMeditationPlayer');
    const onEnd = vi.fn();
    const { result } = renderHook(() => useMeditationPlayer({ onEnd }));

    act(() => {
      result.current.play(makeRecord());
    });

    expect(mockHowlInstances.length).toBe(1);
    const howl = mockHowlInstances[0];

    mockUnload.mockClear();
    revokeObjectURLMock.mockClear();
    wakeRelease.mockClear();

    act(() => {
      howl.__triggerOnend();
    });

    // onEnd must be invoked
    expect(onEnd).toHaveBeenCalledTimes(1);
    // teardown must have run via stop()
    expect(mockUnload).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
    expect(wakeRelease).toHaveBeenCalled();

    // Subsequent stop() should be a no-op (refs cleared)
    mockUnload.mockClear();
    revokeObjectURLMock.mockClear();
    act(() => {
      result.current.stop();
    });
    expect(mockUnload).not.toHaveBeenCalled();
    expect(revokeObjectURLMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Test 7: elapsed polls every 250ms (Pattern 4)
  // -------------------------------------------------------------------------
  it('elapsed updates every 250ms while playing using howl.seek() (Pattern 4)', async () => {
    const { useMeditationPlayer } = await import('../hooks/useMeditationPlayer');
    mockSeek.mockReturnValue(12.5);

    const { result } = renderHook(() => useMeditationPlayer({ onEnd: vi.fn() }));

    act(() => {
      result.current.play(makeRecord());
    });

    expect(result.current.elapsed).toBe(0);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(mockSeek).toHaveBeenCalled();
    expect(result.current.elapsed).toBe(12.5);
  });

  // -------------------------------------------------------------------------
  // Test 8: unmount cleanup unloads + revokes (T-06-03 + T-06-04 mitigation)
  // -------------------------------------------------------------------------
  it('unmount cleanup unloads the Howl and revokes the object URL', async () => {
    const { useMeditationPlayer } = await import('../hooks/useMeditationPlayer');
    const { result, unmount } = renderHook(() => useMeditationPlayer({ onEnd: vi.fn() }));

    act(() => {
      result.current.play(makeRecord());
    });

    mockUnload.mockClear();
    revokeObjectURLMock.mockClear();

    unmount();

    expect(mockUnload).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Test 9: getFormatFromFilename mapping
  // -------------------------------------------------------------------------
  it.each([
    ['test.m4a', 'mp4'],
    ['test.mp3', 'mp3'],
    ['test.wav', 'wav'],
    ['test.unknown', 'mp3'],
  ])('Howl format hint for %s is [%s]', async (filename, expected) => {
    const { useMeditationPlayer } = await import('../hooks/useMeditationPlayer');
    const { Howl } = await import('howler');
    (Howl as unknown as ReturnType<typeof vi.fn>).mockClear();

    const { result } = renderHook(() => useMeditationPlayer({ onEnd: vi.fn() }));

    act(() => {
      result.current.play(makeRecord({ filename }));
    });

    const callArgs = (Howl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArgs.format).toEqual([expected]);
  });

  // -------------------------------------------------------------------------
  // Test 10: leak prevention — calling play twice releases the prior session
  //          before activating the new one (Pitfall 5; D-18 documented invariant).
  //          Acceptable outcomes:
  //            (a) wakeRelease called before wakeActivate for the second play, OR
  //            (b) the second play is a no-op (no extra wakeActivate call).
  // -------------------------------------------------------------------------
  it('calling play() a second time without stop() releases the prior session (Pitfall 5, D-18)', async () => {
    const { useMeditationPlayer } = await import('../hooks/useMeditationPlayer');
    const { result } = renderHook(() => useMeditationPlayer({ onEnd: vi.fn() }));

    act(() => {
      result.current.play(makeRecord({ id: 'a' }));
    });
    expect(wakeActivate).toHaveBeenCalledTimes(1);
    const firstActivateOrder = wakeActivate.mock.invocationCallOrder[0];

    act(() => {
      result.current.play(makeRecord({ id: 'b' }));
    });

    const totalActivates = wakeActivate.mock.calls.length;
    if (totalActivates === 1) {
      // Outcome (b): second play() short-circuited (no-op). No leak introduced.
      expect(totalActivates).toBe(1);
    } else {
      // Outcome (a): second play() began a new session — prior session must
      // have been released first.
      expect(wakeRelease).toHaveBeenCalled();
      const lastReleaseOrder =
        wakeRelease.mock.invocationCallOrder[wakeRelease.mock.invocationCallOrder.length - 1];
      const secondActivateOrder = wakeActivate.mock.invocationCallOrder[1];
      expect(firstActivateOrder).toBeLessThan(lastReleaseOrder);
      expect(lastReleaseOrder).toBeLessThan(secondActivateOrder);
    }
  });
});
