import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  preview: {
    // ponytail: allow cloudflared quick tunnels for on-device PWA testing.
    allowedHosts: ['.trycloudflare.com'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'búho',
        short_name: 'buho',
        description: 'Guided breathing and meditation',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // ponytail: mp3 deliberately excluded from precache. The breathing
        // panel's background music is 5.7 MB; precaching it on every cold
        // start pushed the iOS Safari PWA renderer over its memory budget
        // and triggered "website crashed" relaunches. mp3s are fetched on
        // demand and served by the runtime CacheFirst rule below — same
        // offline guarantee, no startup cost.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'buho-audio',
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
});
