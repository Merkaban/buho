import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Navigation Structure (D-04, D-06)', () => {
  it('renders 3 swipeable panels', () => {
    const { container } = render(<App />);
    const panels = container.querySelectorAll('[data-panel]');
    expect(panels.length).toBe(3);
  });

  it('renders page indicator dots', () => {
    render(<App />);
    const dots = screen.getByRole('tablist', { name: /navigation/i });
    expect(dots).toBeDefined();
  });

  it('renders 3 dot indicators', () => {
    render(<App />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
  });

  it('renders landing screen with app name mindfulONE', () => {
    render(<App />);
    expect(screen.getByText('mindfulONE')).toBeDefined();
  });

  it('renders breathing screen with static white circle (D-14)', () => {
    const { container } = render(<App />);
    const circle = container.querySelector('[data-testid="breathing-circle"]');
    expect(circle).not.toBeNull();
  });

  it('renders meditation screen with placeholder text (D-15)', () => {
    render(<App />);
    expect(screen.getByText('Meditate')).toBeDefined();
  });
});

describe('Safe Area CSS (PWA-04)', () => {
  it('app container has safe-area padding class or style', () => {
    const { container } = render(<App />);
    const safeContainer = container.querySelector('[data-safe-area]');
    expect(safeContainer).not.toBeNull();
  });
});
