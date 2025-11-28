// ======================================================
//  src/components/SupabaseAuth.tsx
//  Handles user authentication (GitHub + Email + Password)
// ======================================================

import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";
import { motion } from "framer-motion";
import { LogOut, Github, User, Mail, Lock, UserPlus, LogIn } from "lucide-react";

interface SupabaseAuthProps {
  onAuthChange: (user: any | null) => void;
}

export default function SupabaseAuth({ onAuthChange }: SupabaseAuthProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // ==========================
  // Session watcher
  // ==========================
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

  // ==========================
  // OAuth: GitHub
  // ==========================
  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github" });
  };

  // ==========================
  // Email/Password Auth
  // ==========================
  const handleAuth = async () => {
    setError(null);
    setProcessing(true);

    try {
      if (!email || !password) {
        setError("Please enter both email and password.");
        return;
      }

      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) setUser(data.user);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("✅ Check your email to confirm your account.");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ==========================
  // Sign Out
  // ==========================
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    onAuthChange(null);
  };

  // ==========================
  // Loading / Auth UI
  // ==========================
  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center text-gray-300">
        <p>Loading session...</p>
      </div>
    );

  // ==========================
  // Not Signed In
  // ==========================
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

        {/* =================== GitHub Button =================== */}
        <motion.button
          onClick={signInWithGitHub}
          className="neon-button flex items-center gap-2 hover:scale-105 transition-transform duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Github size={18} /> Sign in with GitHub
        </motion.button>

        <p className="text-gray-500 text-xs">— or —</p>

        {/* =================== Email Auth Form =================== */}
        <div className="glass-card w-[320px] p-5 text-left space-y-3">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-[#3aa0ff]" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1e2229] text-white rounded p-2 focus:ring-2 focus:ring-[#3aa0ff]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Lock size={16} className="text-[#9b59b6]" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1e2229] text-white rounded p-2 focus:ring-2 focus:ring-[#9b59b6]"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <motion.button
            onClick={handleAuth}
            disabled={processing}
            className="neon-button w-full mt-2 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            {mode === "signin" ? (
              <>
                <LogIn size={16} /> {processing ? "Signing in..." : "Sign In"}
              </>
            ) : (
              <>
                <UserPlus size={16} /> {processing ? "Creating..." : "Sign Up"}
              </>
            )}
          </motion.button>

          <p className="text-xs text-gray-400 text-center mt-2">
            {mode === "signin" ? (
              <>
                Don’t have an account?{" "}
                <button
                  className="text-[#3aa0ff] hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  className="text-[#9b59b6] hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-gray-500 text-xs mt-2">
          No data is shared — your account is secure.
        </p>
      </div>
    );

  // ==========================
  // Signed In
  // ==========================
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
