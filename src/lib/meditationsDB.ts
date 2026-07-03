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
// every cold start (confirmed on-device: crash correlated exactly with one
// large blob present in IDB). Splitting the
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
        // GUARD: no non-IDB awaits (fetch, timers, arbitrary promises) inside
        // this block. The versionchange transaction auto-commits as soon as it
        // has no pending IDB requests; awaiting anything that isn't an IDB
        // request would let the tx close underneath us and abort the upgrade.
        // Every await below is backed by an IDB request (cursor / put).

        // Fresh install (oldVersion 0) or upgrade from v1 both need the two
        // new stores.
        if (!db.objectStoreNames.contains(META_STORE)) {
          const meta = db.createObjectStore(META_STORE, { keyPath: 'id' });
          meta.createIndex('addedAt', 'addedAt');
        }
        if (!db.objectStoreNames.contains(BLOB_STORE)) {
          db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
        }

        // MIGRATION v1 → v2. FAILURE SEMANTICS: the versionchange transaction
        // is atomic — if the upgrade launch is jetsam-killed mid-migration, the
        // whole tx rolls back to the intact v1 database (no data loss, no
        // partial split). The real risk is therefore NOT re-import; it is a
        // retry crash-loop where every relaunch re-attempts the upgrade and is
        // killed again. That risk is low here: the cursor reads one record at a
        // time, and WebKit deserializes IDB Blobs as file-backed handles, so
        // migration peak allocation is well below the v1 getAllFromIndex spike
        // that caused the original crash. Split each legacy record into the two
        // new stores, then drop the legacy store.
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
      blocked() {
        // Another (older-version) connection is keeping v2 from opening — most
        // likely a zombie iOS PWA instance still holding the v1 connection.
        // Log it; the open stays pending until the other connection closes.
        console.warn('[meditationsDB] open blocked: an older DB connection is still open');
      },
      blocking(_currentVersion, _blockedVersion, event) {
        // We are the connection holding an older version open while a newer
        // version wants to upgrade. Close so the upgrade can proceed instead of
        // hanging silently (which would render an empty library with no error).
        // Cheap insurance on iOS, where a zombie PWA instance can linger.
        (event.target as IDBDatabase | null)?.close();
        // Drop the memoized promise so the next call re-opens at the new version.
        dbPromise = null;
      },
      terminated() {
        // The browser abnormally closed the connection (e.g. the DB was
        // deleted, or the renderer was reclaimed). Reset so the next call
        // re-opens rather than reusing a dead handle.
        dbPromise = null;
      },
    }).catch((err) => {
      // Don't leave a rejected promise memoized forever — one transient open
      // failure would otherwise brick DB access until a full relaunch. Reset so
      // the next call retries the open.
      dbPromise = null;
      throw err;
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
