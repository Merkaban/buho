import { openDB, type IDBPDatabase } from 'idb';
import type { MeditationRecord, MeditationMeta } from '../types/meditation';

// Persistence layer for the meditation library (D-06: Blobs in IndexedDB,
// not localStorage). Lazy-opens a single database with one object store on
// first call; the dbPromise is memoized at module scope so concurrent callers
// share the same upgrade transaction.
//
// Schema is single-version; if a future phase needs to migrate, increment
// DB_VERSION and add upgrade logic in getDb().

const DB_NAME = 'buho-meditations';
const DB_VERSION = 1;
const STORE = 'meditations';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('addedAt', 'addedAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function listMeditations(): Promise<MeditationMeta[]> {
  const db = await getDb();
  // Q3 RESOLVED: newest-first; index returns ascending, reverse for descending.
  // ponytail: strip `blob` in JS — IDB has no field-level projection, but we
  // must not let multi-MB Blobs land in React state on cold start (iOS Safari
  // OOMs the PWA renderer). The Blob still rides through structured clone
  // during the read; dropping it before returning keeps the caller-side
  // memory residency bounded to metadata only.
  const records = (await db.getAllFromIndex(STORE, 'addedAt')) as MeditationRecord[];
  return records
    .map(({ blob: _blob, ...meta }) => meta)
    .reverse();
}

// ponytail: paired blob loader. Called only when the user taps a meditation
// to play, so the blob is in memory exactly while it's being played, not for
// the lifetime of the library hook.
export async function getMeditationBlob(id: string): Promise<Blob> {
  const db = await getDb();
  const record = (await db.get(STORE, id)) as MeditationRecord | undefined;
  if (!record) {
    throw new Error(`Meditation not found: ${id}`);
  }
  return record.blob;
}

export async function addMeditation(record: MeditationRecord): Promise<void> {
  const db = await getDb();
  // Use `add` (not `put`) so duplicate ids reject — required by the test 6
  // duplicate-rejection contract and by the keyPath uniqueness guarantee.
  await db.add(STORE, record);
}

export async function deleteMeditation(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}
