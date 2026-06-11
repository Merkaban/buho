import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractDuration } from '../lib/extractDuration';

// Capture listener registrations on the fake audio element so tests can fire
// events synchronously. We model the audio element as a minimal EventTarget
// stand-in: addEventListener stores callbacks per event type, removeEventListener
// removes them, and we expose mutable `duration` / `currentTime` / `src` properties.

interface FakeAudio {
  duration: number;
  currentTime: number;
  src: string;
  preload: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  // Storage of registered listeners by event type. Each entry tracks once-flag.
  __listeners: Record<string, Array<{ cb: EventListener; once: boolean }>>;
  __fire: (type: string) => void;
}

function makeFakeAudio(): FakeAudio {
  const listeners: Record<string, Array<{ cb: EventListener; once: boolean }>> = {};
  const audio: FakeAudio = {
    duration: NaN,
    currentTime: 0,
    src: '',
    preload: '',
    addEventListener: vi.fn((type: string, cb: EventListener, opts?: AddEventListenerOptions | boolean) => {
      const once = typeof opts === 'object' && opts !== null ? !!opts.once : false;
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push({ cb, once });
    }),
    removeEventListener: vi.fn((type: string, cb: EventListener) => {
      const arr = listeners[type];
      if (!arr) return;
      const idx = arr.findIndex((entry) => entry.cb === cb);
      if (idx >= 0) arr.splice(idx, 1);
    }),
    __listeners: listeners,
    __fire(type: string) {
      const arr = listeners[type];
      if (!arr) return;
      // Snapshot the array because `once` listeners get removed during iteration.
      const snapshot = [...arr];
      for (const entry of snapshot) {
        if (entry.once) {
          const idx = arr.indexOf(entry);
          if (idx >= 0) arr.splice(idx, 1);
        }
        // Cast through unknown so we don't fight DOM Event typings here.
        (entry.cb as unknown as () => void)();
      }
    },
  };
  return audio;
}

describe('extractDuration', () => {
  let fakeAudio: FakeAudio;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fakeAudio = makeFakeAudio();
    createObjectURLSpy = vi.fn(() => 'blob:test');
    revokeObjectURLSpy = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'audio') {
        return fakeAudio as unknown as HTMLElement;
      }
      // Fall back to the real implementation for non-audio elements.
      return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    createElementSpy.mockRestore();
  });

  it('resolves to the duration when loadedmetadata reports a finite value', async () => {
    const file = new File([new Blob(['x'])], 'song.mp3', { type: 'audio/mpeg' });
    const promise = extractDuration(file);

    fakeAudio.duration = 754;
    fakeAudio.__fire('loadedmetadata');

    await expect(promise).resolves.toBe(754);
    expect(createObjectURLSpy).toHaveBeenCalledWith(file);
  });

  it('falls back via durationchange when loadedmetadata reports Infinity', async () => {
    const file = new File([new Blob(['x'])], 'voice.m4a', { type: 'audio/mp4' });
    const promise = extractDuration(file);

    // First metadata pass reports Infinity; helper must seek to MAX_SAFE_INTEGER
    // and listen for durationchange.
    fakeAudio.duration = Infinity;
    fakeAudio.__fire('loadedmetadata');
    expect(fakeAudio.currentTime).toBe(Number.MAX_SAFE_INTEGER);

    // durationchange resolves once a finite value is reported.
    fakeAudio.duration = 300;
    fakeAudio.__fire('durationchange');

    await expect(promise).resolves.toBe(300);
  });

  it('rejects with "Could not read audio metadata" when error fires', async () => {
    const file = new File([new Blob(['x'])], 'broken.mp3', { type: 'audio/mpeg' });
    const promise = extractDuration(file);

    fakeAudio.__fire('error');

    await expect(promise).rejects.toThrow('Could not read audio metadata');
  });

  it('revokes the object URL exactly once on success', async () => {
    const file = new File([new Blob(['x'])], 'song.mp3', { type: 'audio/mpeg' });
    const promise = extractDuration(file);

    fakeAudio.duration = 100;
    fakeAudio.__fire('loadedmetadata');
    await promise;

    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');
  });

  it('revokes the object URL exactly once on error', async () => {
    const file = new File([new Blob(['x'])], 'broken.mp3', { type: 'audio/mpeg' });
    const promise = extractDuration(file);

    fakeAudio.__fire('error');
    await promise.catch(() => {
      /* expected rejection */
    });

    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');
  });

  it('stays pending when durationchange still reports non-finite, resolves on the next finite durationchange', async () => {
    const file = new File([new Blob(['x'])], 'odd.webm', { type: 'audio/webm' });
    const promise = extractDuration(file);

    // loadedmetadata: Infinity → fallback.
    fakeAudio.duration = Infinity;
    fakeAudio.__fire('loadedmetadata');

    // First durationchange still reports NaN — must not resolve.
    fakeAudio.duration = NaN;
    fakeAudio.__fire('durationchange');

    let settled = false;
    promise.then(() => {
      settled = true;
    });
    // Give microtasks a chance to flush.
    await Promise.resolve();
    expect(settled).toBe(false);

    // Second durationchange reports a finite value — now resolves.
    fakeAudio.duration = 42;
    fakeAudio.__fire('durationchange');

    await expect(promise).resolves.toBe(42);
  });
});
