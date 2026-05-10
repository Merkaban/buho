import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { CountdownDisplay } from '../components/CountdownDisplay';

describe('useSessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('start(5) sets remaining to 300 (5 * 60)', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useSessionTimer(onComplete));
    act(() => {
      result.current.start(5);
    });
    expect(result.current.remaining).toBe(300);
  });

  it('remaining decrements by 1 each second', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useSessionTimer(onComplete));
    act(() => {
      result.current.start(5);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(299);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(298);
  });

  it('calls onComplete when remaining reaches 0', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useSessionTimer(onComplete));
    act(() => {
      result.current.start(1); // 1 minute = 60 seconds
    });
    act(() => {
      vi.advanceTimersByTime(60000); // advance 60 seconds
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.remaining).toBe(0);
  });

  it('clear() stops countdown and resets remaining to 0', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useSessionTimer(onComplete));
    act(() => {
      result.current.start(5);
    });
    act(() => {
      vi.advanceTimersByTime(3000); // 3 seconds elapsed
    });
    expect(result.current.remaining).toBe(297);
    act(() => {
      result.current.clear();
    });
    expect(result.current.remaining).toBe(0);
    // Timer should be stopped -- advancing time should not call onComplete
    act(() => {
      vi.advanceTimersByTime(300000);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('start(0) does not start a countdown (0 = infinite, no timer)', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useSessionTimer(onComplete));
    act(() => {
      result.current.start(0);
    });
    expect(result.current.remaining).toBe(0);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.remaining).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe('CountdownDisplay', () => {
  it('renders "5:00" when remainingSeconds is 300', () => {
    const { getByTestId } = render(
      CountdownDisplay({ remainingSeconds: 300, visible: true })
    );
    expect(getByTestId('countdown-display').textContent).toBe('5:00');
  });

  it('renders "0:32" when remainingSeconds is 32', () => {
    const { getByTestId } = render(
      CountdownDisplay({ remainingSeconds: 32, visible: true })
    );
    expect(getByTestId('countdown-display').textContent).toBe('0:32');
  });

  it('has aria-hidden="true" when visible is false', () => {
    const { getByTestId } = render(
      CountdownDisplay({ remainingSeconds: 300, visible: false })
    );
    expect(getByTestId('countdown-display').getAttribute('aria-hidden')).toBe('true');
  });

  it('has opacity-0 class when visible is false', () => {
    const { getByTestId } = render(
      CountdownDisplay({ remainingSeconds: 300, visible: false })
    );
    expect(getByTestId('countdown-display').className).toContain('opacity-0');
  });
});
