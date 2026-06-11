import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeditationScreen } from '../components/MeditationScreen';
import { useMeditationLibrary } from '../hooks/useMeditationLibrary';
import type { MeditationRecord } from '../types/meditation';

// Mock the player so this test focuses on view-state orchestration; the
// player's Howler-driven internals are covered by plan 06-05 tests.
vi.mock('../components/MeditationPlayer', () => ({
  MeditationPlayer: ({
    meditation,
    onBack,
  }: {
    meditation: MeditationRecord;
    onBack: () => void;
  }) => (
    <div data-testid="meditation-player">
      <h1>{meditation.filename}</h1>
      <button onClick={onBack}>back-mock</button>
    </div>
  ),
}));

vi.mock('../hooks/useMeditationLibrary', () => ({
  useMeditationLibrary: vi.fn(),
}));

function makeRecord(
  id: string,
  filename: string,
  addedAt = 1000,
): MeditationRecord {
  return {
    id,
    filename,
    duration: 60,
    blob: new Blob(['x'], { type: 'audio/mpeg' }),
    addedAt,
  };
}

function defaultHookReturn(overrides: Partial<ReturnType<typeof useMeditationLibrary>> = {}) {
  return {
    meditations: [] as MeditationRecord[],
    hydrated: true,
    adding: false,
    add: vi.fn(),
    remove: vi.fn(),
    error: null as string | null,
    dismissError: vi.fn(),
    ...overrides,
  };
}

describe('MeditationScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves panel root contract (D-01 panel 2 of 3)', () => {
    vi.mocked(useMeditationLibrary).mockReturnValue(defaultHookReturn());
    const { container } = render(<MeditationScreen />);
    const panel = container.querySelector('[data-panel="meditation"]');
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute('aria-label')).toBe('Meditation');
    expect(panel?.getAttribute('data-view')).toBe('library');
    const cls = panel?.className ?? '';
    expect(cls).toContain('bg-[#5f7d60]');
    expect(cls).toContain('snap-start');
    expect(cls).toContain('snap-always');
    expect(cls).toContain('w-screen');
    expect(cls).toContain('h-dvh');
  });

  it('renders empty state by default (no meditations)', () => {
    vi.mocked(useMeditationLibrary).mockReturnValue(defaultHookReturn());
    render(<MeditationScreen />);
    expect(screen.getByText(/no meditations yet/i)).toBeDefined();
    expect(
      screen.getByRole('button', { name: /add meditation/i }),
    ).toBeDefined();
  });

  it('renders populated library list when meditations exist', () => {
    const r1 = makeRecord('a', 'morning.mp3', 2000);
    const r2 = makeRecord('b', 'evening.mp3', 1000);
    vi.mocked(useMeditationLibrary).mockReturnValue(
      defaultHookReturn({ meditations: [r1, r2] }),
    );
    const { container } = render(<MeditationScreen />);
    const rows = container.querySelectorAll('[data-testid="meditation-row"]');
    expect(rows.length).toBe(2);
  });

  it('tapping a row transitions to playing view (data-view="playing")', () => {
    const r1 = makeRecord('a', 'morning.mp3', 2000);
    vi.mocked(useMeditationLibrary).mockReturnValue(
      defaultHookReturn({ meditations: [r1] }),
    );
    const { container } = render(<MeditationScreen />);
    const row = container.querySelector(
      '[data-testid="meditation-row"]',
    ) as HTMLElement;
    fireEvent.click(row);
    const panel = container.querySelector('[data-panel="meditation"]');
    expect(panel?.getAttribute('data-view')).toBe('playing');
    expect(screen.getByTestId('meditation-player')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'morning.mp3' })).toBeDefined();
  });

  it('back chevron returns to library and unmounts the player', () => {
    const r1 = makeRecord('a', 'morning.mp3', 2000);
    vi.mocked(useMeditationLibrary).mockReturnValue(
      defaultHookReturn({ meditations: [r1] }),
    );
    const { container } = render(<MeditationScreen />);
    const row = container.querySelector(
      '[data-testid="meditation-row"]',
    ) as HTMLElement;
    fireEvent.click(row);
    const back = screen.getByRole('button', { name: 'back-mock' });
    fireEvent.click(back);
    const panel = container.querySelector('[data-panel="meditation"]');
    expect(panel?.getAttribute('data-view')).toBe('library');
    expect(screen.queryByTestId('meditation-player')).toBeNull();
    const rows = container.querySelectorAll('[data-testid="meditation-row"]');
    expect(rows.length).toBe(1);
  });

  it('falls back to library if the selected record disappears (deleted-while-playing)', () => {
    const r1 = makeRecord('a', 'morning.mp3', 2000);
    vi.mocked(useMeditationLibrary).mockReturnValue(
      defaultHookReturn({ meditations: [r1] }),
    );
    const { container, rerender } = render(<MeditationScreen />);
    const row = container.querySelector(
      '[data-testid="meditation-row"]',
    ) as HTMLElement;
    fireEvent.click(row);
    expect(
      container
        .querySelector('[data-panel="meditation"]')
        ?.getAttribute('data-view'),
    ).toBe('playing');
    // Simulate the record being removed (e.g. deleted from another tab/context).
    vi.mocked(useMeditationLibrary).mockReturnValue(
      defaultHookReturn({ meditations: [] }),
    );
    rerender(<MeditationScreen />);
    expect(
      container
        .querySelector('[data-panel="meditation"]')
        ?.getAttribute('data-view'),
    ).toBe('library');
    expect(screen.queryByTestId('meditation-player')).toBeNull();
  });

  it('surfaces hook errors via role="alert"', () => {
    vi.mocked(useMeditationLibrary).mockReturnValue(
      defaultHookReturn({ error: 'Not enough storage' }),
    );
    render(<MeditationScreen />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Not enough storage');
  });
});
