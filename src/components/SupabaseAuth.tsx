// ======================================================
//  src/components/SupabaseAuth.tsx
//  Handles user authentication (sign in/out/session)
// ======================================================

import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";
import { motion } from "framer-motion";
import { LogOut, Github, User } from "lucide-react";

interface SupabaseAuthProps {
  onAuthChange: (user: any | null) => void;
}

export default function SupabaseAuth({ onAuthChange }: SupabaseAuthProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      onAuthChange(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      onAuthChange(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [onAuthChange]);

  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    onAuthChange(null);
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center text-gray-300">
        <p>Loading session...</p>
      </div>
    );

  // If not signed in
  if (!user)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center space-y-6">
        <motion.h1
          className="font-orbitron text-3xl md:text-4xl text-white tracking-wide"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          AIBBRY’s Task Tracker
        </motion.h1>
        <p className="text-gray-300 italic text-sm">
          Sign in to sync tasks securely with Supabase ☁️
        </p>

        <motion.button
          onClick={signInWithGitHub}
          className="neon-button flex items-center gap-2 hover:scale-105 transition-transform duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Github size={18} /> Sign in with GitHub
        </motion.button>

        <p className="text-gray-500 text-xs">No data is shared — your account is secure.</p>
      </div>
    );

  // If signed in
  return (
    <div className="flex items-center gap-4 p-4 fixed top-4 right-6 bg-[#1a1d22cc] border border-gray-700 rounded-2xl shadow-lg backdrop-blur-md z-50">
      <User size={18} className="text-[#44ff9a]" />
      <span className="text-sm text-gray-300 font-mono">{user.email}</span>
      <button
        onClick={signOut}
        className="neon-button flex items-center gap-1 px-3 py-1 text-xs"
      >
        <LogOut size={14} /> Sign Out
      </button>
    </div>
  );
}
