import { describe, it, expect } from 'vitest';
import { formatTime } from '../lib/formatTime';

describe('formatTime', () => {
  // M:SS branch (totalSeconds < 3600) — UI-SPEC line 290 "Locked: M:SS"
  it('returns "0:00" for 0 seconds', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('returns "0:05" for 5 seconds (zero-padded seconds)', () => {
    expect(formatTime(5)).toBe('0:05');
  });

  it('returns "1:05" for 65 seconds (no leading zero on minutes)', () => {
    expect(formatTime(65)).toBe('1:05');
  });

  it('returns "12:34" for 754 seconds (UI-SPEC example line 209)', () => {
    expect(formatTime(754)).toBe('12:34');
  });

  it('returns "1:00" for 60 seconds', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  // H:MM:SS branch (totalSeconds >= 3600) — UI-SPEC line 292
  it('returns "1:00:00" for 3600 seconds (H:MM:SS branch boundary)', () => {
    expect(formatTime(3600)).toBe('1:00:00');
  });

  it('returns "1:02:05" for 3725 seconds (1h 2m 5s — minutes zero-padded)', () => {
    expect(formatTime(3725)).toBe('1:02:05');
  });

  it('returns "2:03:04" for 7384.6 seconds (Math.floor on fractional input)', () => {
    expect(formatTime(7384.6)).toBe('2:03:04');
  });

  it('returns "10:00:00" for 36000 seconds (10 hours)', () => {
    expect(formatTime(36000)).toBe('10:00:00');
  });
});
