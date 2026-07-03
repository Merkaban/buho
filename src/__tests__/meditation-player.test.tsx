import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrictMode } from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { MeditationPlayer } from '../components/MeditationPlayer';
import { useMeditationPlayer } from '../hooks/useMeditationPlayer';
import { getMeditationBlob } from '../lib/meditationsDB';
import type { MeditationMeta, MeditationRecord } from '../types/meditation';

// Mock the hook so component tests can drive state explicitly. The hook itself
// is exhaustively covered by `meditation-player.test.ts`.
vi.mock('../hooks/useMeditationPlayer', () => ({
  useMeditationPlayer: vi.fn(),
}));

// ponytail: lazy-blob — the player fetches the blob on mount via this loader.
// Default mock resolves to a tiny stub Blob so auto-play can fire without
// touching IDB.
vi.mock('../lib/meditationsDB', () => ({
  getMeditationBlob: vi
    .fn()
    .mockResolvedValue(new Blob(['fake'], { type: 'audio/mpeg' })),
}));

const useMeditationPlayerMock = vi.mocked(useMeditationPlayer);
const getMeditationBlobMock = vi.mocked(getMeditationBlob);

function makeMeta(overrides: Partial<MeditationMeta> = {}): MeditationMeta {
  return {
    id: 'rec-1',
    filename: 'morning_calm.mp3',
    duration: 754,
    addedAt: 1_700_000_000_000,
    ...overrides,
  };
}

interface HookSnapshotOverrides {
  play?: ReturnType<typeof vi.fn>;
  pause?: ReturnType<typeof vi.fn>;
  stop?: ReturnType<typeof vi.fn>;
  isPlaying?: boolean;
  elapsed?: number;
  duration?: number;
}

function configureHook(overrides: HookSnapshotOverrides = {}) {
  const play = overrides.play ?? vi.fn();
  const pause = overrides.pause ?? vi.fn();
  const stop = overrides.stop ?? vi.fn();
  useMeditationPlayerMock.mockReturnValue({
    play,
    pause,
    stop,
    isPlaying: overrides.isPlaying ?? false,
    elapsed: overrides.elapsed ?? 0,
    duration: overrides.duration ?? 0,
  });
  return { play, pause, stop };
}

beforeEach(() => {
  useMeditationPlayerMock.mockReset();
  getMeditationBlobMock.mockReset();
  getMeditationBlobMock.mockResolvedValue(new Blob(['fake'], { type: 'audio/mpeg' }));
});

// Pump the microtask queue inside act() so the lazy-blob useEffect's
// getMeditationBlob().then(...) resolves before assertions run.
async function flushBlobLoad() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('MeditationPlayer', () => {
  // -------------------------------------------------------------------------
  // Test 1: title rendered without extension (D-13)
  // -------------------------------------------------------------------------
  it('renders the title with the file extension stripped (D-13)', () => {
    configureHook();
    render(
      <MeditationPlayer
        meta={makeMeta({ filename: 'morning_calm.mp3' })}
        onBack={vi.fn()}
      />
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('morning_calm');
  });

  // -------------------------------------------------------------------------
  // Test 2: time display shows M:SS / M:SS (D-13)
  // -------------------------------------------------------------------------
  it('renders elapsed/total in M:SS / M:SS format (D-13)', () => {
    configureHook({ elapsed: 134, duration: 754 });
    render(<MeditationPlayer meta={makeMeta()} onBack={vi.fn()} />);
    expect(screen.getByText('2:14 / 12:34')).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Test 3: aria-label when paused = "Play meditation" (D-14, copywriting)
  // -------------------------------------------------------------------------
  it('play button is labelled "Play meditation" when paused (D-14)', () => {
    configureHook({ isPlaying: false });
    render(<MeditationPlayer meta={makeMeta()} onBack={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /play meditation/i });
    expect(btn).toBeDefined();
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  // -------------------------------------------------------------------------
  // Test 4: aria-label when playing = "Pause meditation" (D-14, copywriting)
  // -------------------------------------------------------------------------
  it('pause button is labelled "Pause meditation" when playing (D-14)', () => {
    configureHook({ isPlaying: true });
    render(<MeditationPlayer meta={makeMeta()} onBack={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /pause meditation/i });
    expect(btn).toBeDefined();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  // -------------------------------------------------------------------------
  // Test 5: clicking play (when paused) calls play() (D-14)
  // -------------------------------------------------------------------------
  it('tapping play (paused state) calls play(record) (D-14)', async () => {
    const { play } = configureHook({ isPlaying: false });
    const meta = makeMeta();
    const blob = new Blob(['fake'], { type: 'audio/mpeg' });
    getMeditationBlobMock.mockResolvedValueOnce(blob);
    render(<MeditationPlayer meta={meta} onBack={vi.fn()} />);

    // Wait for lazy-blob load → auto-play. Then clear and assert the manual tap.
    await flushBlobLoad();
    play.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /play meditation/i }));
    const expectedRecord: MeditationRecord = { ...meta, blob };
    expect(play).toHaveBeenCalledWith(expectedRecord);
  });

  // -------------------------------------------------------------------------
  // Test 6: clicking pause (when playing) calls pause() (D-14)
  // -------------------------------------------------------------------------
  it('tapping pause (playing state) calls pause() (D-14)', () => {
    const { pause } = configureHook({ isPlaying: true });
    render(<MeditationPlayer meta={makeMeta()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /pause meditation/i }));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Test 7: back chevron calls stop() THEN onBack() (D-14)
  // -------------------------------------------------------------------------
  it('tapping back chevron calls stop() then onBack() in order (D-14)', () => {
    const { stop } = configureHook();
    const onBack = vi.fn();
    render(<MeditationPlayer meta={makeMeta()} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /back to library/i }));

    expect(stop).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
    const stopOrder = stop.mock.invocationCallOrder[0];
    const onBackOrder = onBack.mock.invocationCallOrder[0];
    expect(stopOrder).toBeLessThan(onBackOrder);
  });

  // -------------------------------------------------------------------------
  // Test 8: StrictMode double-mount does not call play() twice (D-15 guard)
  // -------------------------------------------------------------------------
  it('mounts under StrictMode without invoking play() twice', async () => {
    const { play } = configureHook();
    const meta = makeMeta();
    const blob = new Blob(['fake'], { type: 'audio/mpeg' });
    getMeditationBlobMock.mockResolvedValue(blob);
    render(
      <StrictMode>
        <MeditationPlayer meta={meta} onBack={vi.fn()} />
      </StrictMode>
    );

    // Lazy blob load resolves async — flush microtasks before assertion.
    await flushBlobLoad();

    // Auto-play on mount fires exactly once even though StrictMode
    // double-invokes effects in development.
    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith({ ...meta, blob });
  });

  // -------------------------------------------------------------------------
  // Test 9: time element has tabular-nums + aria-live polite
  // -------------------------------------------------------------------------
  it('time text uses tabular-nums and aria-live="polite"', () => {
    configureHook({ elapsed: 134, duration: 754 });
    render(<MeditationPlayer meta={makeMeta()} onBack={vi.fn()} />);
    const timeEl = screen.getByText('2:14 / 12:34');
    expect(timeEl.className).toContain('tabular-nums');
    expect(timeEl.getAttribute('aria-live')).toBe('polite');
  });
});
