import { useState, useEffect } from "react";
import "./index.css";
import { motion } from "framer-motion";
import { Sun, Moon, CheckSquare } from "lucide-react";
import TaskTracker from "./components/TaskTracker";
import { Analytics } from "@vercel/analytics/react"; // ✅ Correct import for Vite + React

export default function App() {
  const [theme, setTheme] = useState<"cyberdark" | "cyberlight">("cyberdark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(theme === "cyberdark" ? "cyberlight" : "cyberdark");

  return (
    <div className="min-h-screen flex flex-col bg-cyber-dark text-neon-cyan transition-all duration-700 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="font-orbitron text-3xl glow-text">
          Life Manager — Daily & Weekly Tracker
        </h1>
        <button onClick={toggleTheme} className="neon-button flex items-center gap-2">
          {theme === "cyberdark" ? <Sun size={18} /> : <Moon size={18} />} Theme
        </button>
      </header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 dashboard-frame"
      >
        <TaskTracker />
      </motion.main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 mt-8">
        <CheckSquare size={14} className="inline mr-1" />
        Stay productive, MotherFucker!
      </footer>

      {/* ✅ Vercel Analytics (tracks usage automatically when deployed on Vercel) */}
      <Analytics />
    </div>
  );
}
