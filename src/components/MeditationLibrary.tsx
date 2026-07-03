import { MeditationListRow } from './MeditationListRow';
import { AddMeditationButton } from './AddMeditationButton';
import type { MeditationMeta } from '../types/meditation';

export interface MeditationLibraryProps {
  meditations: MeditationMeta[];
  hydrated: boolean;
  adding: boolean;
  error: string | null;
  onAdd: (file: File) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDismissError: () => void;
}

// MeditationLibrary — props-driven panel orchestrator.
//
// Three render branches:
//   1. !hydrated      → minimal aria-hidden div so we don't flash empty state
//                       during the first IDB tick.
//   2. meditations==0 → State A (D-09): "No meditations yet" + "Add your
//                       first recording" + AddMeditationButton variant=empty.
//   3. meditations>0  → State B (D-10): 'Meditations' header + scrollable
//                       <ul> of <MeditationListRow> + AddMeditationButton
//                       variant=list-end.
//
// `error` toast (UI-SPEC line 332) is rendered ABOVE both A and B branches
// so it appears in either state.
//
// `adding` is forwarded as `pending` to BOTH AddMeditationButton variants —
// the empty-state button must also show "Adding…" while a file is being
// processed (UI-SPEC line 331).
export function MeditationLibrary({
  meditations,
  hydrated,
  adding,
  error,
  onAdd,
  onSelect,
  onDelete,
  onDismissError,
}: MeditationLibraryProps) {
  if (!hydrated) {
    return <div data-testid="library-loading" aria-hidden="true" />;
  }

  const errorToast = error ? (
    <div
      role="alert"
      onClick={onDismissError}
      className="text-sm text-[#e08080]/80 px-4 py-2 mx-4 mt-2 rounded bg-white/5"
    >
      {error}
    </div>
  ) : null;

  if (meditations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full px-6">
        {errorToast}
        <h2 className="text-base font-normal text-white/60 text-center">No meditations yet</h2>
        <p className="text-sm font-normal text-[#666666] text-center mt-2">
          Add your first recording
        </p>
        <div className="mt-8">
          <AddMeditationButton variant="empty" onFile={onAdd} pending={adding} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full pt-4">
      {errorToast}
      <h2 className="text-xs uppercase tracking-wider text-white/60 px-6 pt-4 pb-3">Meditations</h2>
      <ul className="flex-1 overflow-y-auto px-4 list-none m-0 p-0">
        {meditations.map((meditation) => (
          <li key={meditation.id}>
            <MeditationListRow
              meditation={meditation}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>
      <AddMeditationButton variant="list-end" onFile={onAdd} pending={adding} />
    </div>
  );
}
