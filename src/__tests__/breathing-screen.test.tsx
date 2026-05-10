import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { BreathingScreen } from '../components/BreathingScreen';

// Mock Element.animate since jsdom doesn't implement Web Animations API
beforeAll(() => {
  Element.prototype.animate = vi.fn().mockReturnValue({
    onfinish: null,
    cancel: vi.fn(),
    finished: Promise.resolve(),
  });
});

describe('Breathing Screen Interaction (BRTH-04, BRTH-05)', () => {
  it('renders breathing circle at resting size (D-11)', () => {
    const { container } = render(<BreathingScreen />);
    const circle = container.querySelector('[data-testid="breathing-circle"]');
    expect(circle).not.toBeNull();
  });

  it('tapping circle starts a session (D-09, BRTH-04)', () => {
    const { container } = render(<BreathingScreen />);
    const circle = container.querySelector('[data-testid="breathing-circle"]') as HTMLElement;
    fireEvent.click(circle);
    // After starting, circle should have data-session="running" attribute
    expect(circle.closest('[data-session]')?.getAttribute('data-session')).toBe('running');
  });

  it('tapping circle again stops the session (D-10, BRTH-05)', () => {
    const { container } = render(<BreathingScreen />);
    const circle = container.querySelector('[data-testid="breathing-circle"]') as HTMLElement;
    fireEvent.click(circle); // start
    fireEvent.click(circle); // stop
    expect(circle.closest('[data-session]')?.getAttribute('data-session')).toBe('idle');
  });

  it('circle has glow effect in idle state (D-11)', () => {
    const { container } = render(<BreathingScreen />);
    const circle = container.querySelector('[data-testid="breathing-circle"]') as HTMLElement;
    // Idle state should have shadow class for glow
    expect(circle.className).toContain('shadow-');
  });

  it('circle has no glow effect during session (D-12)', () => {
    const { container } = render(<BreathingScreen />);
    const circle = container.querySelector('[data-testid="breathing-circle"]') as HTMLElement;
    fireEvent.click(circle); // start
    expect(circle.className).toContain('shadow-none');
  });

  it('preserves data-panel attribute for navigation (existing contract)', () => {
    const { container } = render(<BreathingScreen />);
    const panel = container.querySelector('[data-panel="breathing"]');
    expect(panel).not.toBeNull();
  });
});

describe('Breathing Animation (BRTH-06, BRTH-07, BRTH-08)', () => {
  it('calls Element.animate when session starts', () => {
    const { container } = render(<BreathingScreen />);
    const circle = container.querySelector('[data-testid="breathing-circle"]') as HTMLElement;
    fireEvent.click(circle); // start
    expect(Element.prototype.animate).toHaveBeenCalled();
  });

  it('animation uses scale transform (not width/height)', () => {
    const { container } = render(<BreathingScreen />);
    const circle = container.querySelector('[data-testid="breathing-circle"]') as HTMLElement;
    fireEvent.click(circle);
    const callArgs = (Element.prototype.animate as ReturnType<typeof vi.fn>).mock.calls[0];
    const keyframes = callArgs[0] as Keyframe[];
    expect(keyframes.some((kf: Keyframe) => String(kf.transform).includes('scale'))).toBe(true);
  });

  it('animation cancels on stop', () => {
    const mockCancel = vi.fn();
    (Element.prototype.animate as ReturnType<typeof vi.fn>).mockReturnValue({
      onfinish: null,
      cancel: mockCancel,
      finished: Promise.resolve(),
    });
    const { container } = render(<BreathingScreen />);
    const circle = container.querySelector('[data-testid="breathing-circle"]') as HTMLElement;
    fireEvent.click(circle); // start
    fireEvent.click(circle); // stop
    expect(mockCancel).toHaveBeenCalled();
  });
});
