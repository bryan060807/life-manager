// ======================================================
//  src/App.tsx — AIBBRY’s Task Tracker Root
// ======================================================

import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";
import "./index.css";
import MainTaskTracker from "./components/MainTaskTracker";
import SupabaseAuth from "./components/SupabaseAuth";
import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const [user, setUser] = useState<any>(null);

  return (
    <div
      className="min-h-screen flex flex-col bg-cyber-dark text-neon-cyan transition-all duration-700 p-6"
      style={{
        position: "relative",
        overflow: "visible", // ✅ Prevents fixed HUD clipping
        zIndex: 0,
      }}
    >
      {/* ====================== AUTH / MAIN ====================== */}
      {user ? (
        <motion.main
          key="main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 dashboard-frame"
        >
          <MainTaskTracker user={user} onSignOut={() => setUser(null)} />
        </motion.main>
      ) : (
        <motion.div
          key="auth"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex items-center justify-center"
        >
          <SupabaseAuth onAuthChange={setUser} />
        </motion.div>
      )}

      {/* ====================== FOOTER ====================== */}
      <footer className="text-center text-xs text-gray-500 mt-8">
        <CheckSquare size={14} className="inline mr-1" />
        Stay productive, MotherFucker!
      </footer>

      {/* ✅ Vercel Analytics */}
      <Analytics />
    </div>
  );
}
