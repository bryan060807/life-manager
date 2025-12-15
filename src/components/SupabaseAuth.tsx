// src/components/SupabaseAuth.tsx
import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import { Github, LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { toast } from '../lib/toast';

interface Props {
  onAuthChange: (user: any | null) => void;
}

export default function SupabaseAuth({ onAuthChange }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [processing, setProcessing] = useState(false);

  // current origin (localhost:5173 / life-manager.aibry.shop)
  const currentOrigin = window.location.origin;
  const redirectUrl = import.meta.env.VITE_REDIRECT_URL || currentOrigin;

  /* ----------  Session watcher  ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      onAuthChange(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      onAuthChange(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [onAuthChange]);

  /* ----------  GitHub OAuth  ---------- */
  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: redirectUrl } // ← local or prod
    });
    if (error) toast('GitHub sign-in failed', error.message);
  };

  /* ----------  Email / Password  ---------- */
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) return toast('Missing fields', 'Email and password required.');
    setProcessing(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast('Check your email', 'We sent a confirmation link.');
      }
    } catch (err: any) {
      toast(mode === 'signin' ? 'Sign-in failed' : 'Sign-up failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  /* ----------  Full-screen auth wrapper  ---------- */
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md space-y-6"
      >
        <h1 className="font-orbitron text-3xl md:text-4xl title-gradient">AIBBRY’s Task Tracker</h1>
        <p className="text-gray-300 italic text-sm">Sign in to sync tasks securely with Supabase ☁️</p>

        <motion.button
          onClick={signInWithGitHub}
          className="neon-button flex items-center justify-center gap-2 w-full"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Github size={18} /> Sign in with GitHub
        </motion.button>

        <p className="text-gray-500 text-xs">— or —</p>

        <div className="glass-card w-full p-6 space-y-4">
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

          <button
            onClick={handleAuth}
            disabled={processing}
            className="neon-button w-full flex items-center justify-center gap-2"
          >
            {mode === 'signin' ? (
              <>
                <LogIn size={16} /> {processing ? 'Signing in…' : 'Sign In'}
              </>
            ) : (
              <>
                <UserPlus size={16} /> {processing ? 'Creating…' : 'Sign Up'}
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-2">
            {mode === 'signin' ? (
              <>
                Don’t have an account?{' '}
                <button className="text-[#3aa0ff] hover:underline" onClick={() => setMode('signup')}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button className="text-[#9b59b6] hover:underline" onClick={() => setMode('signin')}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-gray-500 text-xs">No data is shared — your account is secure.</p>
      </motion.div>
    </div>
  );
}