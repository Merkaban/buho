import { useEffect, useRef, useState } from 'react';
import { formatTime } from '../lib/formatTime';
import type { MeditationMeta } from '../types/meditation';

interface MeditationListRowProps {
  meditation: MeditationMeta;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

// Single library row (D-10) + inline delete confirmation (D-11).
//
// Tap the row body to play; tap the trash icon to enter a confirming state
// where the row's content swaps to "Delete {filename}? Cancel Delete". Tapping
// outside the row while confirming auto-dismisses (UI-SPEC line 264, iOS
// contextual-menu UX).
//
// The outer row is `<div role="button" tabIndex={0}>` rather than a real
// `<button>` because the trash and confirmation buttons are nested `<button>`
// elements; nesting `<button>` inside `<button>` is invalid HTML and React
// will warn. role="button" + Enter/Space onKeyDown preserves the same
// keyboard semantics.
export function MeditationListRow({ meditation, onSelect, onDelete }: MeditationListRowProps) {
  const [confirming, setConfirming] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // Outside-tap auto-dismiss (UI-SPEC line 264). The listener is attached only
  // while confirming so we don't pay for a document-wide handler at rest.
  useEffect(() => {
    if (!confirming) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rowRef.current && !rowRef.current.contains(event.target as Node)) {
        setConfirming(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [confirming]);

  if (confirming) {
    return (
      <div
        ref={rowRef}
        data-testid="meditation-row"
        className="flex items-center justify-between min-h-14 px-4 py-3 border-b border-white/10 w-full"
      >
        <span className="text-sm font-normal text-white truncate flex-1 mr-4">
          Delete {meditation.filename}?
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
          }}
          aria-label="Cancel delete"
          className="text-sm font-normal text-white/70 active:text-white px-3 py-2 min-w-11 min-h-11"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(meditation.id);
            setConfirming(false);
          }}
          aria-label={`Confirm delete ${meditation.filename}`}
          className="text-sm font-normal text-[#e08080] active:text-[#e08080]/80 px-3 py-2 min-w-11 min-h-11"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rowRef}
      data-testid="meditation-row"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(meditation.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(meditation.id);
        }
      }}
      className="flex items-center justify-between min-h-14 px-4 py-3 active:bg-white/5 transition-colors duration-150 border-b border-white/10 w-full"
    >
      <span className="text-sm font-normal text-white truncate flex-1 mr-4">
        {meditation.filename}
      </span>
      <span className="text-sm font-normal text-white/60 tabular-nums shrink-0 mr-2">
        {formatTime(meditation.duration)}
      </span>
      <button
        type="button"
        data-testid="meditation-row-delete"
        onClick={(e) => {
          e.stopPropagation();
          setConfirming(true);
        }}
        aria-label={`Delete ${meditation.filename}`}
        className="w-10 h-10 flex items-center justify-center text-[#e08080]/70 active:text-[#e08080] transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}
