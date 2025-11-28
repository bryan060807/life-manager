// ======================================================
//  src/App.tsx — AIBBRY’s Task Tracker (No Duplicate Header)
// ======================================================

import { useState } from "react";
import "./index.css";
import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import SupabaseAuth from "./components/SupabaseAuth";
import MainTaskTracker from "./components/MainTaskTracker";

export default function App() {
  const [user, setUser] = useState<any>(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0c10] text-white transition-all duration-700 p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(58,160,255,0.08), transparent 60%), radial-gradient(circle at 70% 80%, rgba(155,89,182,0.08), transparent 60%)",
          zIndex: 0,
        }}
      />

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 relative z-10"
      >
        {user ? (
          <MainTaskTracker user={user} onSignOut={() => setUser(null)} />
        ) : (
          <SupabaseAuth onAuthChange={setUser} />
        )}
      </motion.main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 mt-8 relative z-10">
        <CheckSquare size={14} className="inline mr-1" />
        Stay productive, MotherFucker!
      </footer>

      <Analytics />
    </div>
  );
}
