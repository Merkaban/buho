import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  registerBootAndCheckCrashLoop,
  renderSafeModeViewer,
} from '../lib/safeBoot';

const COUNT_KEY = 'buho-crash-count';
const LOG_KEY = 'buho-boot-log';

let store: Record<string, string>;

function stubLocalStorage() {
  store = {};
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  });
}

describe('safe-boot crash-loop gate', () => {
  beforeEach(() => {
    stubLocalStorage();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('increments the crash count on each boot', () => {
    registerBootAndCheckCrashLoop();
    expect(localStorage.getItem(COUNT_KEY)).toBe('1');
    registerBootAndCheckCrashLoop();
    expect(localStorage.getItem(COUNT_KEY)).toBe('2');
  });

  it('does not enter crash loop on the first two boots', () => {
    expect(registerBootAndCheckCrashLoop().inCrashLoop).toBe(false); // prior 0
    expect(registerBootAndCheckCrashLoop().inCrashLoop).toBe(false); // prior 1
  });

  it('enters crash loop once prior count reaches the threshold (>= 2)', () => {
    registerBootAndCheckCrashLoop(); // prior 0 -> 1
    registerBootAndCheckCrashLoop(); // prior 1 -> 2
    const third = registerBootAndCheckCrashLoop(); // prior 2 -> crash loop
    expect(third.inCrashLoop).toBe(true);
    expect(third.count).toBe(2);
  });

  it('resets the counter to 0 after a healthy boot survives 5 seconds', () => {
    registerBootAndCheckCrashLoop();
    expect(localStorage.getItem(COUNT_KEY)).toBe('1');
    vi.advanceTimersByTime(5000);
    expect(localStorage.getItem(COUNT_KEY)).toBe('0');
  });

  it('tolerates a corrupt (non-numeric) stored count', () => {
    localStorage.setItem(COUNT_KEY, 'not-a-number');
    const result = registerBootAndCheckCrashLoop();
    expect(result.inCrashLoop).toBe(false);
    expect(localStorage.getItem(COUNT_KEY)).toBe('1');
  });
});

describe('safe-boot viewer rendering', () => {
  beforeEach(() => {
    stubLocalStorage();
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the boot log and a Continue button into #root without React', () => {
    localStorage.setItem(LOG_KEY, '123 main.tsx loaded\n124 listMeditations() called\n');
    const root = document.getElementById('root')!;
    renderSafeModeViewer(root, 2);

    const pre = root.querySelector('pre');
    expect(pre?.textContent).toContain('listMeditations() called');

    const button = root.querySelector('button');
    expect(button?.textContent).toBe('Continue anyway');
    expect(root.textContent).toContain('2 consecutive crashed boots');
  });

  it('shows a placeholder when the boot log is empty', () => {
    const root = document.getElementById('root')!;
    renderSafeModeViewer(root, 3);
    expect(root.querySelector('pre')?.textContent).toContain('boot log empty');
  });
});
