import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.png',
        'robots.txt',
        'sitemap.xml',
        'apple-touch-icon.png',
        'backgrounds/city_fire_image.webp',   // ← webp only
      ],
      manifest: {
        name: "AIBBRY's Task Tracker",
        short_name: 'AIBBRY',
        description: 'Cyberpunk task dashboard synced via Supabase.',
        theme_color: '#0a0a0a',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json,webp,avif}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/([a-zA-Z0-9-]+\.)?supabase\.co\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: 'CacheFirst',
            options: { cacheName: 'image-assets', expiration: { maxEntries: 60, maxAgeSeconds: 2592000 } },
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages-cache', expiration: { maxEntries: 10, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],

  build: {
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('framer-motion')) return 'motion';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },

  server: { host: true, port: 5173 },

  resolve: { alias: { '@': '/src' } },

  optimizeDeps: {
    include: ['@supabase/supabase-js', 'framer-motion', 'lucide-react', 'vite-plugin-pwa'],
  },
});