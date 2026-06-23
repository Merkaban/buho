import { openDB, type IDBPDatabase } from 'idb';
import type { MeditationRecord } from '../types/meditation';

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

export async function listMeditations(): Promise<MeditationRecord[]> {
  const db = await getDb();
  // Q3 RESOLVED: newest-first; index returns ascending, reverse for descending
  const records = await db.getAllFromIndex(STORE, 'addedAt');
  return (records as MeditationRecord[]).reverse();
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
