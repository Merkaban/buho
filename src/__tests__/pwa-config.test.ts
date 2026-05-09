import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const viteConfig = readFileSync(resolve(__dirname, '../../vite.config.ts'), 'utf-8');

describe('Service Worker / Offline Config (PWA-02)', () => {
  it('uses registerType autoUpdate for immediate SW activation', () => {
    expect(viteConfig).toContain("registerType: 'autoUpdate'");
  });

  it('has globPatterns to precache static assets', () => {
    expect(viteConfig).toContain('globPatterns:');
    expect(viteConfig).toContain('**/*.{js,css,html,ico,png,svg,woff2}');
  });

  it('has cleanupOutdatedCaches enabled', () => {
    expect(viteConfig).toContain('cleanupOutdatedCaches: true');
  });

  it('includes apple-touch-icon in includeAssets', () => {
    expect(viteConfig).toContain('apple-touch-icon.png');
  });

  it('includes favicon in includeAssets', () => {
    expect(viteConfig).toContain('favicon.ico');
  });
});
