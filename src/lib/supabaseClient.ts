// ======================================================
//  src/lib/supabaseClient.ts
//  AIBBRY’s Task Tracker — Supabase Client Helper
// ======================================================

import { createClient } from "@supabase/supabase-js";

// Pull from Vite environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase environment variables.");
  console.error("Add them to your .env file:");
  console.error("VITE_SUPABASE_URL=your-url");
  console.error("VITE_SUPABASE_ANON_KEY=your-anon-key");
}

// Create and export the Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, // keeps user logged in
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "X-Client-Info": "AIBBRY-TaskTracker/3.0",
    },
  },
});

export default supabase;
