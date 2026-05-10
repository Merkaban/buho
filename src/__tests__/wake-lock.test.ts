import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from '../hooks/useWakeLock';

describe('useWakeLock (BRTH-13)', () => {
  let mockSentinel: {
    released: boolean;
    type: 'screen';
    release: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    dispatchEvent: ReturnType<typeof vi.fn>;
    onrelease: null;
  };

  beforeEach(() => {
    mockSentinel = {
      released: false,
      type: 'screen' as const,
      release: vi.fn().mockImplementation(() => {
        mockSentinel.released = true;
        return Promise.resolve();
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onrelease: null,
    };

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: vi.fn().mockResolvedValue(mockSentinel) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('activate() calls navigator.wakeLock.request("screen")', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.activate();
    });

    expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen');
  });

  it('release() calls sentinel.release()', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.activate();
    });

    await act(async () => {
      await result.current.release();
    });

    expect(mockSentinel.release).toHaveBeenCalled();
  });

  it('activate() then release() prevents visibilitychange reacquisition', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.activate();
    });

    await act(async () => {
      await result.current.release();
    });

    // Clear call count after release
    (navigator.wakeLock.request as ReturnType<typeof vi.fn>).mockClear();

    // Simulate page becoming visible
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should NOT reacquire because session is inactive
    expect(navigator.wakeLock.request).not.toHaveBeenCalled();
  });

  it('visibilitychange to "visible" while active reacquires wake lock', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.activate();
    });

    // Clear call count after initial activation
    (navigator.wakeLock.request as ReturnType<typeof vi.fn>).mockClear();

    // Simulate page becoming visible while session is still active
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen');
  });

  it('visibilitychange to "visible" while inactive does NOT reacquire', async () => {
    const { result } = renderHook(() => useWakeLock());

    // Never activated -- simulate visibility change
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(navigator.wakeLock.request).not.toHaveBeenCalled();
  });

  it('activate() when navigator.wakeLock is undefined does not throw', async () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWakeLock());

    // Should not throw
    await act(async () => {
      await result.current.activate();
    });
  });

  it('request rejection does not throw, logs warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (navigator.wakeLock.request as ReturnType<typeof vi.fn>).mockRejectedValue(
      new DOMException('Low battery', 'NotAllowedError')
    );

    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.activate();
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'Wake lock request failed:',
      'Low battery'
    );

    warnSpy.mockRestore();
  });

  it('cleanup on unmount releases held sentinel', async () => {
    const { result, unmount } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.activate();
    });

    unmount();

    expect(mockSentinel.release).toHaveBeenCalled();
  });
});
