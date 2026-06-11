import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeditationPlayer } from '../components/MeditationPlayer';
import { useMeditationPlayer } from '../hooks/useMeditationPlayer';
import type { MeditationRecord } from '../types/meditation';

// Mock the hook so component tests can drive state explicitly. The hook itself
// is exhaustively covered by `meditation-player.test.ts`.
vi.mock('../hooks/useMeditationPlayer', () => ({
  useMeditationPlayer: vi.fn(),
}));

const useMeditationPlayerMock = vi.mocked(useMeditationPlayer);

function makeRecord(overrides: Partial<MeditationRecord> = {}): MeditationRecord {
  return {
    id: 'rec-1',
    filename: 'morning_calm.mp3',
    duration: 754,
    blob: new Blob(['fake'], { type: 'audio/mpeg' }),
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
});

describe('MeditationPlayer', () => {
  // -------------------------------------------------------------------------
  // Test 1: title rendered without extension (D-13)
  // -------------------------------------------------------------------------
  it('renders the title with the file extension stripped (D-13)', () => {
    configureHook();
    render(
      <MeditationPlayer
        meditation={makeRecord({ filename: 'morning_calm.mp3' })}
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
    render(<MeditationPlayer meditation={makeRecord()} onBack={vi.fn()} />);
    expect(screen.getByText('2:14 / 12:34')).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Test 3: aria-label when paused = "Play meditation" (D-14, copywriting)
  // -------------------------------------------------------------------------
  it('play button is labelled "Play meditation" when paused (D-14)', () => {
    configureHook({ isPlaying: false });
    render(<MeditationPlayer meditation={makeRecord()} onBack={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /play meditation/i });
    expect(btn).toBeDefined();
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  // -------------------------------------------------------------------------
  // Test 4: aria-label when playing = "Pause meditation" (D-14, copywriting)
  // -------------------------------------------------------------------------
  it('pause button is labelled "Pause meditation" when playing (D-14)', () => {
    configureHook({ isPlaying: true });
    render(<MeditationPlayer meditation={makeRecord()} onBack={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /pause meditation/i });
    expect(btn).toBeDefined();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  // -------------------------------------------------------------------------
  // Test 5: clicking play (when paused) calls play() (D-14)
  // -------------------------------------------------------------------------
  it('tapping play (paused state) calls play(meditation) (D-14)', () => {
    const { play } = configureHook({ isPlaying: false });
    const meditation = makeRecord();
    render(<MeditationPlayer meditation={meditation} onBack={vi.fn()} />);

    // The first call to play() is the auto-mount one — clear it before asserting.
    play.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /play meditation/i }));
    expect(play).toHaveBeenCalledWith(meditation);
  });

  // -------------------------------------------------------------------------
  // Test 6: clicking pause (when playing) calls pause() (D-14)
  // -------------------------------------------------------------------------
  it('tapping pause (playing state) calls pause() (D-14)', () => {
    const { pause } = configureHook({ isPlaying: true });
    render(<MeditationPlayer meditation={makeRecord()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /pause meditation/i }));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Test 7: back chevron calls stop() THEN onBack() (D-14)
  // -------------------------------------------------------------------------
  it('tapping back chevron calls stop() then onBack() in order (D-14)', () => {
    const { stop } = configureHook();
    const onBack = vi.fn();
    render(<MeditationPlayer meditation={makeRecord()} onBack={onBack} />);

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
  it('mounts under StrictMode without invoking play() twice', () => {
    const { play } = configureHook();
    const meditation = makeRecord();
    render(
      <StrictMode>
        <MeditationPlayer meditation={meditation} onBack={vi.fn()} />
      </StrictMode>
    );

    // Auto-play on mount fires exactly once even though StrictMode
    // double-invokes effects in development.
    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith(meditation);
  });

  // -------------------------------------------------------------------------
  // Test 9: time element has tabular-nums + aria-live polite
  // -------------------------------------------------------------------------
  it('time text uses tabular-nums and aria-live="polite"', () => {
    configureHook({ elapsed: 134, duration: 754 });
    render(<MeditationPlayer meditation={makeRecord()} onBack={vi.fn()} />);
    const timeEl = screen.getByText('2:14 / 12:34');
    expect(timeEl.className).toContain('tabular-nums');
    expect(timeEl.getAttribute('aria-live')).toBe('polite');
  });
});
