// ======================================================
// vite.config.ts — AIBBRY’s Task Tracker (Vercel Ready)
// ======================================================

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env and .env.local
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    // Ensure your Vite build plays well with Vercel static output
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      target: "esnext",
      chunkSizeWarningLimit: 900,
      cssMinify: "lightningcss",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
    },

    // Environment variable exposure (VITE_ prefix only)
    define: {
      "process.env": env,
    },

    // Resolve common issues on Windows paths & imports
    resolve: {
      alias: {
        "@": "/src",
      },
    },

    // Recommended server settings for local dev
    server: {
      port: 5173,
      open: true,
      host: true,
    },

    // Optimize dependencies (helps Vercel builds)
    optimizeDeps: {
      include: ["@supabase/supabase-js", "framer-motion", "lucide-react"],
    },
  };
});
