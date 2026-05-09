import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read the vite config to extract manifest settings
const viteConfig = readFileSync(resolve(__dirname, '../../vite.config.ts'), 'utf-8');

describe('PWA Manifest (PWA-01, PWA-03)', () => {
  it('has name set to mindfulONE', () => {
    expect(viteConfig).toContain("name: 'mindfulONE'");
  });

  it('has short_name set to buho', () => {
    expect(viteConfig).toContain("short_name: 'buho'");
  });

  it('has display set to standalone for PWA-03', () => {
    expect(viteConfig).toContain("display: 'standalone'");
  });

  it('has start_url set to /', () => {
    expect(viteConfig).toContain("start_url: '/'");
  });

  it('has theme_color set to #000000', () => {
    expect(viteConfig).toContain("theme_color: '#000000'");
  });

  it('has background_color set to #000000', () => {
    expect(viteConfig).toContain("background_color: '#000000'");
  });

  it('has 192x192 icon for PWA-01 installability', () => {
    expect(viteConfig).toContain("sizes: '192x192'");
  });

  it('has 512x512 icon for PWA-01 installability', () => {
    expect(viteConfig).toContain("sizes: '512x512'");
  });

  it('has maskable icon as separate entry (not combined any maskable)', () => {
    expect(viteConfig).toContain("purpose: 'maskable'");
    expect(viteConfig).not.toContain("purpose: 'any maskable'");
  });

  it('has orientation set to portrait', () => {
    expect(viteConfig).toContain("orientation: 'portrait'");
  });
});
