import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// MEDT-01, MEDT-02, MEDT-03, MEDT-07 — IDB CRUD round-trip tests.
//
// These tests run against a real (in-memory) IndexedDB implementation supplied
// by the `fake-indexeddb` polyfill (wired in `vitest.config.ts` setupFiles).
// jsdom 29 itself does not ship an IndexedDB implementation — RESEARCH.md
// §"Wave 0 Gaps" line 663 was wrong on this point; the polyfill is the only
// path that exposes a working `indexedDB` global in the test environment.
//
// Each test starts with a brand-new IDBFactory (fresh database universe) AND
// a fresh module cache (so the memoized `dbPromise` inside `meditationsDB.ts`
// cannot leak between tests). Swapping the IDBFactory side-steps the
// "deleteDatabase blocks on open connections" problem that arises when the
// previous test's module is dropped before its db handle is closed.
//
// Per RESEARCH.md §"Open Questions (RESOLVED)" Q3, `listMeditations` returns
// records ordered newest-first (descending by addedAt). Tests 2 and 7 enforce
// this — Test 2 covers the two-record case, Test 7 catches an accidental flip
// back to ascending or to insertion-order.

const DB_NAME = 'buho-meditations';
const META_STORE = 'meditations-meta';
const BLOB_STORE = 'meditations-blobs';

// Open the raw DB (bypassing the module under test) so we can assert the
// on-disk shape directly: which store a record actually lives in. Uses the
// current global IDBFactory, which beforeEach replaces per test.
function openRaw(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function countStore(db: IDBDatabase, store: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function makeBlob(byte: number = 1): Blob {
  return new Blob([new Uint8Array([byte, byte + 1, byte + 2, byte + 3])], {
    type: 'audio/mpeg',
  });
}

async function freshModule() {
  // Drop any prior module-level dbPromise so the next call to getDb() opens
  // against the freshly-installed IDBFactory.
  vi.resetModules();
  return await import('../lib/meditationsDB');
}

describe('meditationsDB (MEDT-01, MEDT-02, MEDT-03, MEDT-07)', () => {
  beforeEach(async () => {
    // Replace the global IDBFactory with a fresh instance so every test starts
    // from a clean database universe. This also prevents the previous test's
    // open connection from blocking deleteDatabase (per the file header).
    // We additionally wipe the named database so the assertion is bullet-proof.
    (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('round-trips metadata only — addMeditation persists to both stores but listMeditations reads ONLY the meta store (split-store fix for iOS cold-start OOM)', async () => {
    const { addMeditation, listMeditations, getMeditationBlob } = await freshModule();
    const blob = makeBlob(1);
    const record = {
      id: 'rec-1',
      filename: 'morning.mp3',
      duration: 123.4,
      blob,
      addedAt: 1700000000000,
    };

    await addMeditation(record);
    const list = await listMeditations();

    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('rec-1');
    expect(list[0].filename).toBe('morning.mp3');
    expect(list[0].duration).toBe(123.4);
    expect(list[0].addedAt).toBe(1700000000000);
    // Split-store: the list result MUST NOT carry the Blob field. This is the
    // load-bearing invariant — the multi-MB blob must never be structured-
    // cloned on cold start, which is what killed the iOS Safari PWA renderer.
    expect(list[0]).not.toHaveProperty('blob');

    // (a) list never touches the blob store — assert the on-disk split: the
    // meta store holds the record with NO blob field; the blob lives ONLY in
    // the blob store. This proves listMeditations() cannot clone the blob.
    const db = await openRaw();
    const metaRec = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const r = db.transaction(META_STORE, 'readonly').objectStore(META_STORE).get('rec-1');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    expect(metaRec).toBeDefined();
    expect(metaRec).not.toHaveProperty('blob');
    expect(metaRec.filename).toBe('morning.mp3');
    const blobRec = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const r = db.transaction(BLOB_STORE, 'readonly').objectStore(BLOB_STORE).get('rec-1');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    // The blob store holds a record keyed by id with a blob payload. (We assert
    // the payload is a real Blob via getMeditationBlob below — reading it back
    // through this separate raw connection deserializes it opaquely under
    // fake-indexeddb, so we only assert presence here.)
    expect(blobRec).toBeDefined();
    expect(blobRec).toHaveProperty('blob');
    db.close();

    // (b) the blob is retrievable by id via getMeditationBlob, proving the
    // blob store was written and the lazy read path works. (Under the jsdom +
    // fake-indexeddb test env the Blob deserializes opaquely, so we assert it
    // is defined rather than a strict Blob instance — matching the pre-split
    // round-trip test's proven approach.)
    const retrieved = await getMeditationBlob('rec-1');
    expect(retrieved).toBeDefined();
  });

  it('deleteMeditation clears BOTH stores — no orphaned blob is left behind', async () => {
    const { addMeditation, deleteMeditation } = await freshModule();
    await addMeditation({
      id: 'rec-del',
      filename: 'gone.mp3',
      duration: 42,
      blob: makeBlob(9),
      addedAt: 3000,
    });

    // Before delete: both stores hold the record.
    const before = await openRaw();
    expect(await countStore(before, META_STORE)).toBe(1);
    expect(await countStore(before, BLOB_STORE)).toBe(1);
    before.close();

    await deleteMeditation('rec-del');

    // After delete: BOTH stores are empty. A delete that cleared only the meta
    // store would leak the 18.7 MB blob against the tight iOS storage budget.
    const after = await openRaw();
    expect(await countStore(after, META_STORE)).toBe(0);
    expect(await countStore(after, BLOB_STORE)).toBe(0);
    after.close();
  });

  it('getMeditationBlob rejects for an unknown id', async () => {
    const { getMeditationBlob } = await freshModule();
    await expect(getMeditationBlob('does-not-exist')).rejects.toThrow(/not found/i);
  });

  it('lists two records in descending-by-addedAt (newest-first) order', async () => {
    const { addMeditation, listMeditations } = await freshModule();
    await addMeditation({
      id: 'rec-old',
      filename: 'older.mp3',
      duration: 60,
      blob: makeBlob(2),
      addedAt: 1000,
    });
    await addMeditation({
      id: 'rec-new',
      filename: 'newer.mp3',
      duration: 90,
      blob: makeBlob(3),
      addedAt: 2000,
    });

    const list = await listMeditations();

    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('rec-new');
    expect(list[1].id).toBe('rec-old');
    expect(list[0].addedAt).toBeGreaterThan(list[1].addedAt);
  });

  it('deleteMeditation removes the record and listMeditations no longer returns it', async () => {
    const { addMeditation, deleteMeditation, listMeditations } = await freshModule();
    await addMeditation({
      id: 'rec-1',
      filename: 'one.mp3',
      duration: 10,
      blob: makeBlob(4),
      addedAt: 1000,
    });
    await addMeditation({
      id: 'rec-2',
      filename: 'two.mp3',
      duration: 20,
      blob: makeBlob(5),
      addedAt: 2000,
    });

    await deleteMeditation('rec-1');
    const list = await listMeditations();

    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('rec-2');
  });

  it('persists across module reload (record survives a fresh import — proof it is in IDB, not memory)', async () => {
    const first = await freshModule();
    await first.addMeditation({
      id: 'rec-persist',
      filename: 'persist.mp3',
      duration: 30,
      blob: makeBlob(6),
      addedAt: 5000,
    });

    // Simulate a "fresh page load" — clear the module cache so the memoized
    // dbPromise is gone, then import the module again. The record should still
    // be visible because it lives in IDB, not in JS memory.
    const second = await freshModule();
    const list = await second.listMeditations();

    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('rec-persist');
    expect(list[0].filename).toBe('persist.mp3');
  });

  it('migrates a legacy v1 single-store DB into the split meta+blob stores on upgrade', async () => {
    // Seed a v1-shaped database directly: one `meditations` store holding the
    // full record (metadata + blob together), exactly as the pre-split schema
    // wrote it. Then let the module under test open at v2 and run its upgrade.
    const LEGACY_STORE = 'meditations';
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(LEGACY_STORE, { keyPath: 'id' });
        store.createIndex('addedAt', 'addedAt');
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(LEGACY_STORE, 'readwrite');
        tx.objectStore(LEGACY_STORE).add({
          id: 'legacy-1',
          filename: 'legacy.mp3',
          duration: 77,
          blob: makeBlob(8),
          addedAt: 4000,
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });

    // Now open through the module (v2) — the upgrade handler migrates.
    const { listMeditations, getMeditationBlob } = await freshModule();
    const list = await listMeditations();

    // Metadata survived the migration and lists correctly, with no blob field.
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('legacy-1');
    expect(list[0].filename).toBe('legacy.mp3');
    expect(list[0].duration).toBe(77);
    expect(list[0]).not.toHaveProperty('blob');

    // The blob was moved into the blob store and is still retrievable.
    const retrieved = await getMeditationBlob('legacy-1');
    expect(retrieved).toBeDefined();

    // The legacy store is gone after migration.
    const db = await openRaw();
    expect(db.objectStoreNames.contains(LEGACY_STORE)).toBe(false);
    expect(db.objectStoreNames.contains(META_STORE)).toBe(true);
    expect(db.objectStoreNames.contains(BLOB_STORE)).toBe(true);
    db.close();
  });

  it('rejects when addMeditation is called twice with the same id', async () => {
    const { addMeditation } = await freshModule();
    const record = {
      id: 'dup-id',
      filename: 'dup.mp3',
      duration: 10,
      blob: makeBlob(7),
      addedAt: 1000,
    };

    await addMeditation(record);
    await expect(addMeditation(record)).rejects.toThrow();
  });

  it('sorts three records by addedAt descending regardless of insertion order (regression for Q3 RESOLVED)', async () => {
    const { addMeditation, listMeditations } = await freshModule();

    // Insert in non-monotonic order: 1000, 3000, 2000 — proves the sort is
    // driven by addedAt, not by insertion order, AND that the direction is
    // descending (not ascending).
    await addMeditation({
      id: 'rec-1000',
      filename: 'a.mp3',
      duration: 10,
      blob: makeBlob(1),
      addedAt: 1000,
    });
    await addMeditation({
      id: 'rec-3000',
      filename: 'c.mp3',
      duration: 30,
      blob: makeBlob(3),
      addedAt: 3000,
    });
    await addMeditation({
      id: 'rec-2000',
      filename: 'b.mp3',
      duration: 20,
      blob: makeBlob(2),
      addedAt: 2000,
    });

    const list = await listMeditations();

    expect(list.map((r) => r.addedAt)).toEqual([3000, 2000, 1000]);
    expect(list[0].id).toBe('rec-3000');
    expect(list[2].id).toBe('rec-1000');
  });
});
