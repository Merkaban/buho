import { useState, useEffect, useCallback } from 'react';
import { listMeditations, addMeditation, deleteMeditation } from '../lib/meditationsDB';
import { extractDuration } from '../lib/extractDuration';
import { bootLog } from '../lib/bootLog';
import type { MeditationRecord, MeditationMeta } from '../types/meditation';

// React-side library state. Lazy-hydrates from IndexedDB on mount; exposes
// add/remove that wraps `meditationsDB` and `extractDuration` so the UI never
// has to reach into either of those directly.
//
// Returned shape (per Plan 06-04 <interfaces>):
//   meditations  — current array of records (newest-first, matching D-07 sort)
//   hydrated     — false until the first IDB load resolves; UI uses this to
//                  avoid flashing the empty state during the first tick
//   adding       — true while extract-duration + IDB write is in flight; the
//                  AddMeditationButton consumes this as `pending` (UI-SPEC
//                  line 331 — "Adding…" + disabled)
//   add(file)    — extracts duration, builds the record, writes to IDB,
//                  prepends to local state. Surfaces quota errors as
//                  'Not enough storage' and bad files as 'Could not read file'.
//                  `adding` always resets in `finally` so the button never
//                  gets stuck.
//   remove(id)   — deletes from IDB then filters local state
//   error        — last error message for the inline toast; null when none
//   dismissError — clears error
export function useMeditationLibrary(): {
  meditations: MeditationMeta[];
  hydrated: boolean;
  adding: boolean;
  add: (file: File) => Promise<void>;
  remove: (id: string) => Promise<void>;
  error: string | null;
  dismissError: () => void;
} {
  const [meditations, setMeditations] = useState<MeditationMeta[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cancelled-flag idiom (PATTERNS.md lines 207–215) — guards against the
    // setState-after-unmount warning if the panel unmounts while listMeditations
    // is still pending. This is the project's first async hydration, so the
    // pattern is documented here as the new convention.
    let cancelled = false;
    bootLog('useMeditationLibrary: listMeditations() called');
    listMeditations()
      .then((list) => {
        bootLog(`useMeditationLibrary: listMeditations() resolved n=${list.length}`);
        if (cancelled) return;
        setMeditations(list);
        setHydrated(true);
      })
      .catch((err) => {
        bootLog(`useMeditationLibrary: listMeditations() rejected ${String(err)}`);
        // If the IDB open itself fails (private mode, corrupt DB, etc.) we
        // still flip hydrated true so the UI can render the empty state — the
        // user can still try to add. The error toast surfaces on the next add.
        if (cancelled) return;
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(async (file: File) => {
    setAdding(true);
    try {
      let duration: number;
      try {
        duration = await extractDuration(file);
      } catch {
        setError('Could not read file');
        return;
      }
      const record: MeditationRecord = {
        id: crypto.randomUUID(),
        filename: file.name,
        duration,
        blob: file,
        addedAt: Date.now(),
      };
      try {
        await addMeditation(record);
        // ponytail: state holds metadata only. The blob was just written to
        // IDB; keeping it in React state too would defeat the lazy-blob fix
        // and re-introduce the iOS cold-start OOM.
        const { blob: _blob, ...meta } = record;
        setMeditations((prev) => [meta, ...prev]);
      } catch (err) {
        if (err instanceof Error && /quota/i.test(err.name + ' ' + err.message)) {
          setError('Not enough storage');
          throw err;
        }
        setError('Could not save meditation');
        throw err;
      }
    } finally {
      // MUST live in `finally` — the button never gets stuck on `Adding…`,
      // whether the duration extractor rejects, IDB throws, or the happy
      // path resolves. Locked by Plan 06-04 Task 2 acceptance criteria.
      setAdding(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteMeditation(id);
    setMeditations((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return { meditations, hydrated, adding, add, remove, error, dismissError };
}
