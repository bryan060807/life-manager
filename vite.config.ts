import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// ======================================================
//  Vite Configuration — AIBBRY’s Task Tracker
//  Features:
//  ⚡ React + TypeScript + TailwindCSS
//  🔥 PWA Offline Support (manifest + service worker)
//  ☁️ Supabase-friendly build (no SSR conflicts)
//  🚀 Vercel-optimized output for static deployment
// ======================================================

export default defineConfig({
  plugins: [
    react(),

    // ================================
    // 🔥 PWA Integration
    // ================================
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.png",
        "robots.txt",
        "apple-touch-icon.png",
        "backgrounds/city_fire_image.png",
      ],
      manifest: {
        name: "AIBBRY’s Task Tracker",
        short_name: "AIBBRY Tracker",
        description:
          "Cyberpunk-themed Supabase task tracker — synced, offline-ready, and fast.",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/([a-zA-Z0-9-]+\.)?supabase\.co\/.*$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "image-assets",
              expiration: { maxEntries: 50, maxAgeSeconds: 2592000 },
            },
          },
        ],
      },
    }),
  ],

  // ================================
  // ⚙️ Build Settings
  // ================================
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
  },

  // ================================
  // 🌍 Server Configuration
  // ================================
  server: {
    host: true,
    port: 5173,
  },

  // ================================
  // ⚡ Resolve Aliases
  // ================================
  resolve: {
    alias: {
      "@": "/src",
    },
  },

  // ================================
  // 🚀 Vercel Build Hint
  // ================================
  optimizeDeps: {
    include: ["@supabase/supabase-js", "framer-motion", "lucide-react"],
  },
});
