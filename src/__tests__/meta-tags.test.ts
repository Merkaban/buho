import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const indexHtml = readFileSync(resolve(__dirname, '../../index.html'), 'utf-8');

describe('iOS Meta Tags (PWA-03)', () => {
  it('has apple-mobile-web-app-capable set to yes', () => {
    expect(indexHtml).toContain('apple-mobile-web-app-capable" content="yes"');
  });

  it('has apple-mobile-web-app-status-bar-style set to black-translucent', () => {
    expect(indexHtml).toContain('apple-mobile-web-app-status-bar-style" content="black-translucent"');
  });

  it('has apple-mobile-web-app-title set to buho', () => {
    expect(indexHtml).toContain('apple-mobile-web-app-title" content="buho"');
  });

  it('has apple-touch-icon link', () => {
    expect(indexHtml).toContain('rel="apple-touch-icon"');
  });

  it('has theme-color meta set to #000000', () => {
    expect(indexHtml).toContain('theme-color" content="#000000"');
  });
});

describe('Safe Area Handling (PWA-04)', () => {
  it('has viewport-fit=cover in viewport meta tag', () => {
    expect(indexHtml).toContain('viewport-fit=cover');
  });

  it('has inline background-color to prevent white flash', () => {
    expect(indexHtml).toContain('background-color: #000000');
  });
});
