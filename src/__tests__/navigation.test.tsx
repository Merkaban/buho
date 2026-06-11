import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Navigation Structure (D-04, D-06)', () => {
  beforeEach(async () => {
    await indexedDB.deleteDatabase('buho-meditations');
  });

  it('renders 3 swipeable panels', () => {
    const { container } = render(<App />);
    const panels = container.querySelectorAll('[data-panel]');
    expect(panels.length).toBe(3);
  });

  it('renders page indicator dots', () => {
    render(<App />);
    const dots = screen.getByRole('group', { name: /navigation indicator/i });
    expect(dots).toBeDefined();
  });

  it('renders 3 dot indicators', () => {
    const { container } = render(<App />);
    const dots = container.querySelectorAll('[role="group"] > [aria-hidden="true"]');
    expect(dots.length).toBe(3);
  });

  it('renders landing screen with app name búho', () => {
    render(<App />);
    expect(screen.getByText('búho')).toBeDefined();
  });

  it('renders breathing screen with static white circle (D-14)', () => {
    const { container } = render(<App />);
    const circle = container.querySelector('[data-testid="breathing-circle"]');
    expect(circle).not.toBeNull();
  });

  it('renders meditation screen with empty-state add button (MEDT-03)', async () => {
    render(<App />);
    expect(await screen.findByRole('button', { name: /add meditation/i })).toBeDefined();
  });
});

describe('Safe Area CSS (PWA-04)', () => {
  it('app container has safe-area padding class or style', () => {
    const { container } = render(<App />);
    const safeContainer = container.querySelector('[data-safe-area]');
    expect(safeContainer).not.toBeNull();
  });
});
