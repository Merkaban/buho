import { useState, useEffect } from 'react';
import { useMeditationLibrary } from '../hooks/useMeditationLibrary';
import { MeditationLibrary } from './MeditationLibrary';
import { MeditationPlayer } from './MeditationPlayer';
import { bootLog } from '../lib/bootLog';
import type { MeditationView } from '../types/meditation';

bootLog('MeditationScreen module evaluated');

/**
 * Meditation panel (D-01 panel 2 of 3) — orchestration container.
 *
 * Owns:
 *   - `useMeditationLibrary()` — single hook instance shared across views, so
 *     the meditations array persists when transitioning library ⇆ player.
 *   - View state: `'library' | 'playing'` + the selected record id. The view
 *     state is a render-switch (UI-SPEC §"Component Hierarchy" lines 405–421);
 *     library and player never co-exist in the DOM.
 *
 * Panel root contract (locked by D-01 / PATTERNS.md "Panel Root Pattern"
 * lines 871–885): outer div keeps `data-panel="meditation"`,
 * `aria-label="Meditation"`, sage `bg-[#5f7d60]`, and the snap classes so
 * navigation.test.tsx's 3-panel structure assertion still passes. Only new
 * attribute is `data-view={view}` for testability/observability.
 *
 * Deleted-while-playing recovery (RESEARCH.md §"Failure Modes Worth Probing"
 * line 651): if `view === 'playing'` but the looked-up record is null (e.g. the
 * user deleted it from another tab, or the meditations array changes
 * underneath us), an effect resets the view to 'library' so we never render a
 * player with no source.
 */
export function MeditationScreen() {
  bootLog('MeditationScreen render() entered');
  const [view, setView] = useState<MeditationView>('library');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { meditations, hydrated, adding, add, remove, error, dismissError } =
    useMeditationLibrary();

  const selected =
    view === 'playing' && selectedId
      ? meditations.find((m) => m.id === selectedId) ?? null
      : null;

  // If we're in 'playing' but the record vanished, fall back to 'library'.
  // Deps: react to changes in either the view, the selected id, or the
  // meditations array (so an external delete triggers the fallback).
  useEffect(() => {
    if (view === 'playing' && !selected) {
      setView('library');
      setSelectedId(null);
    }
  }, [view, selected]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setView('playing');
  };

  const handleBack = () => {
    setView('library');
    setSelectedId(null);
  };

  const handleAdd = (file: File) => {
    // Hook owns the async lifecycle (extract duration, write IDB, surface
    // errors via `error`). We don't await here — the button shows "Adding…"
    // via `adding` regardless.
    void add(file);
  };

  const handleDelete = (id: string) => {
    // If the user deletes the currently-playing record, snap back to library
    // BEFORE calling remove() so the player unmounts cleanly.
    if (id === selectedId) {
      setView('library');
      setSelectedId(null);
    }
    void remove(id);
  };

  return (
    <div
      data-panel="meditation"
      aria-label="Meditation"
      data-view={view}
      className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex items-center justify-center bg-[#5f7d60] relative"
    >
      <div className="absolute inset-0 flex flex-col">
        {view === 'library' ? (
          <MeditationLibrary
            meditations={meditations}
            hydrated={hydrated}
            adding={adding}
            error={error}
            onAdd={handleAdd}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onDismissError={dismissError}
          />
        ) : selected ? (
          <MeditationPlayer meta={selected} onBack={handleBack} />
        ) : null}
      </div>
    </div>
  );
}
