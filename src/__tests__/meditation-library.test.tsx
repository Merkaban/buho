import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeditationLibrary } from '../components/MeditationLibrary';
import type { MeditationRecord } from '../types/meditation';

// Component-level tests; the IDB layer is not exercised here (the component
// is props-driven). The hook integration test for IDB round-trip lives in
// src/__tests__/meditations-db.test.ts (plan 06-03).
vi.mock('../lib/meditationsDB', () => ({
  listMeditations: vi.fn().mockResolvedValue([]),
  addMeditation: vi.fn().mockResolvedValue(undefined),
  deleteMeditation: vi.fn().mockResolvedValue(undefined),
  getMeditation: vi.fn().mockResolvedValue(undefined),
}));

function makeRecord(overrides?: Partial<MeditationRecord>): MeditationRecord {
  return {
    id: 'rec-1',
    filename: 'test.mp3',
    duration: 754,
    blob: new Blob(['x']),
    addedAt: 1000,
    ...overrides,
  };
}

interface RenderOpts {
  meditations?: MeditationRecord[];
  hydrated?: boolean;
  adding?: boolean;
  error?: string | null;
  onAdd?: (file: File) => void;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDismissError?: () => void;
}

function renderLibrary(overrides: RenderOpts = {}) {
  const props = {
    meditations: overrides.meditations ?? [],
    hydrated: overrides.hydrated ?? true,
    adding: overrides.adding ?? false,
    error: overrides.error ?? null,
    onAdd: overrides.onAdd ?? vi.fn(),
    onSelect: overrides.onSelect ?? vi.fn(),
    onDelete: overrides.onDelete ?? vi.fn(),
    onDismissError: overrides.onDismissError ?? vi.fn(),
  };
  const utils = render(<MeditationLibrary {...props} />);
  return { ...utils, props };
}

describe('MeditationLibrary', () => {
  it('renders the empty state when hydrated and meditations is empty', () => {
    renderLibrary();
    expect(screen.getByText('No meditations yet')).toBeDefined();
    expect(screen.getByText('Add your first recording')).toBeDefined();
    expect(screen.getByRole('button', { name: /add meditation/i })).toBeDefined();
  });

  it('renders one row per meditation in the populated state', () => {
    renderLibrary({
      meditations: [
        makeRecord({ id: 'a', filename: 'morning_calm.mp3', duration: 754 }),
        makeRecord({ id: 'b', filename: 'evening_wind.mp3', duration: 492 }),
      ],
    });
    const rows = screen.getAllByTestId('meditation-row');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('morning_calm.mp3')).toBeDefined();
    expect(screen.getByText('evening_wind.mp3')).toBeDefined();
    // Duration formatting (754s → 12:34, 492s → 8:12)
    expect(screen.getByText('12:34')).toBeDefined();
    expect(screen.getByText('8:12')).toBeDefined();
  });

  it('renders a loading sentinel when not hydrated', () => {
    renderLibrary({ hydrated: false });
    expect(screen.queryByText('No meditations yet')).toBeNull();
    expect(screen.queryByRole('button', { name: /add meditation/i })).toBeNull();
  });

  it('forwards the picked file to onAdd', () => {
    const onAdd = vi.fn();
    const { container } = renderLibrary({ onAdd });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Blob(['x'])], 'pick.mp3', { type: 'audio/mpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(file);
  });

  it('runs the trash → confirm → delete flow and calls onDelete with the id', () => {
    const onDelete = vi.fn();
    renderLibrary({
      meditations: [makeRecord({ id: 'rec-1', filename: 'test.mp3' })],
      onDelete,
    });

    // Click trash → confirmation appears
    fireEvent.click(screen.getByRole('button', { name: 'Delete test.mp3' }));
    expect(screen.getByText('Delete test.mp3?')).toBeDefined();

    // Click Cancel → original row content returns (filename visible without
    // the leading 'Delete ' prefix); the row is back to non-confirming state.
    fireEvent.click(screen.getByRole('button', { name: 'Cancel delete' }));
    expect(screen.queryByText('Delete test.mp3?')).toBeNull();
    expect(screen.getByText('test.mp3')).toBeDefined();

    // Click trash again → confirmation again
    fireEvent.click(screen.getByRole('button', { name: 'Delete test.mp3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete test.mp3' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('rec-1');
  });

  it('does not call onSelect when the trash button is tapped', () => {
    const onSelect = vi.fn();
    renderLibrary({
      meditations: [makeRecord({ id: 'rec-1', filename: 'test.mp3' })],
      onSelect,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete test.mp3' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('calls onSelect when the row body is tapped', () => {
    const onSelect = vi.fn();
    renderLibrary({
      meditations: [makeRecord({ id: 'rec-1', filename: 'test.mp3' })],
      onSelect,
    });
    fireEvent.click(screen.getByTestId('meditation-row'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('rec-1');
  });

  it('renders the error toast and calls onDismissError on click', () => {
    const onDismissError = vi.fn();
    renderLibrary({ error: 'Not enough storage', onDismissError });
    const toast = screen.getByRole('alert');
    expect(toast.textContent).toBe('Not enough storage');
    fireEvent.click(toast);
    expect(onDismissError).toHaveBeenCalledTimes(1);
  });

  it('shows the pending Adding… label and disables the button when adding=true', () => {
    const { rerender, props } = renderLibrary({ adding: true });
    const pendingButton = screen.getByRole('button', { name: /adding meditation/i }) as HTMLButtonElement;
    expect(pendingButton.textContent).toContain('Adding…');
    expect(pendingButton.disabled).toBe(true);

    rerender(<MeditationLibrary {...props} adding={false} />);
    const idleButton = screen.getByRole('button', { name: /add meditation/i }) as HTMLButtonElement;
    expect(idleButton.textContent).toContain('Add meditation');
    expect(idleButton.disabled).toBe(false);
  });

  it('auto-dismisses the delete confirmation when the user taps outside the row', () => {
    const onDelete = vi.fn();
    renderLibrary({
      meditations: [makeRecord({ id: 'rec-1', filename: 'test.mp3' })],
      onDelete,
    });

    // Enter confirming state
    fireEvent.click(screen.getByRole('button', { name: 'Delete test.mp3' }));
    expect(screen.getByText('Delete test.mp3?')).toBeDefined();

    // Outside tap on document.body → confirmation auto-dismisses without delete
    fireEvent.pointerDown(document.body);
    expect(screen.queryByText('Delete test.mp3?')).toBeNull();
    expect(screen.getByText('test.mp3')).toBeDefined();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
