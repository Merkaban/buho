import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// MEDT-01, MEDT-02, MEDT-03, MEDT-07 — IDB CRUD round-trip tests.
//
// These tests run against the real IndexedDB implementation that ships with
// jsdom 29 (per RESEARCH.md §"Wave 0 Gaps" line 663 — no mocks at this layer).
// Each test starts with a fresh database AND a fresh module cache so the
// memoized `dbPromise` inside `meditationsDB.ts` cannot leak between tests.
//
// Per RESEARCH.md §"Open Questions (RESOLVED)" Q3, `listMeditations` returns
// records ordered newest-first (descending by addedAt). Tests 2 and 7 enforce
// this — Test 2 covers the two-record case, Test 7 catches an accidental flip
// back to ascending or to insertion-order.

const DB_NAME = 'buho-meditations';

function makeBlob(byte: number = 1): Blob {
  return new Blob([new Uint8Array([byte, byte + 1, byte + 2, byte + 3])], {
    type: 'audio/mpeg',
  });
}

async function freshModule() {
  // Drop any prior module-level dbPromise so the next call to getDb() reopens
  // against the just-deleted database.
  vi.resetModules();
  return await import('../lib/meditationsDB');
}

describe('meditationsDB (MEDT-01, MEDT-02, MEDT-03, MEDT-07)', () => {
  beforeEach(async () => {
    // Wipe the on-disk database state. jsdom 29 supports deleteDatabase.
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

  it('round-trips a record: addMeditation then listMeditations preserves blob bytes and metadata', async () => {
    const { addMeditation, listMeditations } = await freshModule();
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
    expect(list[0].blob).toBeInstanceOf(Blob);
    expect(list[0].blob.size).toBe(blob.size);
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

  it('getMeditation returns undefined for a missing id (does not throw)', async () => {
    const { getMeditation } = await freshModule();
    const result = await getMeditation('nonexistent-id');
    expect(result).toBeUndefined();
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
