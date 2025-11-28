import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// ======================================================
//  🚀 AIBBRY’s Task Tracker - Vite Configuration
//  ⚡ React + TypeScript + TailwindCSS
//  🔥 Full PWA support (installable, offline-ready)
//  ☁️ Supabase-friendly static deployment
//  🌐 Optimized for Vercel Hosting
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
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any",
          },
        ],
      },

      // ================================
      // ⚙️ Workbox (Offline Cache Rules)
      // ================================
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"],
        runtimeCaching: [
          {
            // Supabase REST + storage requests
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
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
            },
          },
          {
            // Images & Assets
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "image-assets",
              expiration: { maxEntries: 60, maxAgeSeconds: 2592000 },
            },
          },
          {
            // Fallback for index.html
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 },
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
    chunkSizeWarningLimit: 800,
  },

  // ================================
  // 🌍 Dev Server Settings
  // ================================
  server: {
    host: true,
    port: 5173,
  },

  // ================================
  // 🔗 Path Aliases
  // ================================
  resolve: {
    alias: {
      "@": "/src",
    },
  },

  // ================================
  // 🚀 Dependency Optimization
  // ================================
  optimizeDeps: {
    include: [
      "@supabase/supabase-js",
      "framer-motion",
      "lucide-react",
      "vite-plugin-pwa",
    ],
  },
});
