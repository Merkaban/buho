import { openDB, type IDBPDatabase } from 'idb';
import type { MeditationRecord, MeditationMeta } from '../types/meditation';

// Persistence layer for the meditation library (D-06: Blobs in IndexedDB,
// not localStorage). Lazy-opens a single database on first call; the dbPromise
// is memoized at module scope so concurrent callers share the same upgrade
// transaction.
//
// SCHEMA v2 — SPLIT STORES (iOS cold-start OOM fix, H3 confirmed 2026-07-03):
//   `meditations-meta`  — { id, filename, duration, addedAt }, keyPath 'id',
//                         index 'addedAt'. This is the ONLY store touched on
//                         cold start.
//   `meditations-blobs` — { id, blob }, keyPath 'id'. Read lazily via
//                         getMeditationBlob(id) only when the user taps play.
//
// Why: in v1 both metadata and the multi-MB Blob lived on one record in one
// store. listMeditations() called getAllFromIndex(), which structured-clones
// the ENTIRE record set — including the 18.7 MB Blob — into the renderer heap
// before the JS strip could drop the field. On iOS Safari standalone-PWA the
// jetsam watchdog killed the renderer ~100ms after that allocation spike on
// every cold start (confirmed on-device via the safe-boot log). Splitting the
// stores means the cold-start read (listMeditations → meta store) never
// materializes a Blob at all.

const DB_NAME = 'buho-meditations';
const DB_VERSION = 2;
const META_STORE = 'meditations-meta';
const BLOB_STORE = 'meditations-blobs';
const LEGACY_STORE = 'meditations';

interface BlobRecord {
  id: string;
  blob: Blob;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        // Fresh install (oldVersion 0) or upgrade from v1 both need the two
        // new stores.
        if (!db.objectStoreNames.contains(META_STORE)) {
          const meta = db.createObjectStore(META_STORE, { keyPath: 'id' });
          meta.createIndex('addedAt', 'addedAt');
        }
        if (!db.objectStoreNames.contains(BLOB_STORE)) {
          db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
        }

        // MIGRATION v1 → v2. KNOWN RISK: iterating the legacy store reads each
        // full record — including its Blob — into the renderer, exactly the
        // clone we are trying to avoid. On a memory-tight cold start this
        // single upgrade launch could itself be jetsam-killed. Since this is a
        // single-user personal app (D-06 scope), we accept that risk for a
        // SIMPLE cursor migration: split each legacy record into the two new
        // stores, then drop the legacy store. If the upgrade launch is killed
        // mid-migration, the user re-adds the mp3 on a fresh install — no data
        // integrity concern beyond re-import. This is recorded in the debug
        // session file with reasoning.
        if (oldVersion >= 1 && db.objectStoreNames.contains(LEGACY_STORE)) {
          const legacy = tx.objectStore(LEGACY_STORE);
          const metaStore = tx.objectStore(META_STORE);
          const blobStore = tx.objectStore(BLOB_STORE);
          let cursor = await legacy.openCursor();
          while (cursor) {
            const rec = cursor.value as MeditationRecord;
            const { blob, ...meta } = rec;
            await metaStore.put(meta);
            await blobStore.put({ id: rec.id, blob } satisfies BlobRecord);
            cursor = await cursor.continue();
          }
          db.deleteObjectStore(LEGACY_STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function listMeditations(): Promise<MeditationMeta[]> {
  const db = await getDb();
  // Cold-start read path. Reads ONLY the meta store — the Blob store is never
  // touched here, so no multi-MB structured clone ever lands in the renderer
  // heap on launch. This is the load-bearing invariant behind the iOS OOM fix.
  // Q3 RESOLVED: newest-first; index returns ascending, reverse for descending.
  const metas = (await db.getAllFromIndex(META_STORE, 'addedAt')) as MeditationMeta[];
  return metas.reverse();
}

// Paired blob loader. Called only when the user taps a meditation to play, so
// the blob is in memory exactly while it's being played — never on cold start.
export async function getMeditationBlob(id: string): Promise<Blob> {
  const db = await getDb();
  const record = (await db.get(BLOB_STORE, id)) as BlobRecord | undefined;
  if (!record) {
    throw new Error(`Meditation not found: ${id}`);
  }
  return record.blob;
}

export async function addMeditation(record: MeditationRecord): Promise<void> {
  const db = await getDb();
  // Write both stores in ONE transaction so metadata and blob can never drift
  // apart. Use `add` (not `put`) on the meta store so duplicate ids reject —
  // required by the duplicate-rejection contract and the keyPath uniqueness
  // guarantee. The blob store also uses `add` so the whole write is atomic.
  const { blob, ...meta } = record;
  const tx = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
  await Promise.all([
    tx.objectStore(META_STORE).add(meta),
    tx.objectStore(BLOB_STORE).add({ id: record.id, blob } satisfies BlobRecord),
    tx.done,
  ]);
}

export async function deleteMeditation(id: string): Promise<void> {
  const db = await getDb();
  // Remove from both stores in one transaction so no orphaned blob is left
  // behind (which would waste the tight iOS storage budget).
  const tx = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
  await Promise.all([
    tx.objectStore(META_STORE).delete(id),
    tx.objectStore(BLOB_STORE).delete(id),
    tx.done,
  ]);
}
