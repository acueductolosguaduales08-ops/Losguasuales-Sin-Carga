import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: false, // ya existe public/manifest.json, no duplicar
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        // Solo cachea GET, nunca POST/PUT/DELETE, y no toca auth.
        // SUPABASE-ONLY: ya no hay onrender; se cachea Supabase REST + Storage.
        runtimeCaching: [
          {
            // Tier1: Supabase REST/Storage públicos — NetworkFirst 7d
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') &&
              (url.pathname.includes('/rest/v1/') || url.pathname.includes('/storage/v1/')),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-tier1',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 8,
            },
          },
          {
            // Imágenes: CacheFirst
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 80, maxAgeSeconds: 30 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
