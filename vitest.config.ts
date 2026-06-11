import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
    globals: true,
    // jsdom 29 does not ship an IndexedDB implementation; fake-indexeddb/auto
    // installs `indexedDB` and the related `IDB*` constructors on the global
    // object so tests can hit a real (in-memory) IDB without manual setup.
    setupFiles: ['fake-indexeddb/auto'],
  },
});
