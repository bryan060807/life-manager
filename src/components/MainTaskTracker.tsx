// ======================================================
//  src/components/MainTaskTracker.tsx
//  AIBBRY’s Task Tracker — Main Task Logic
// ======================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Trash2,
  CheckCircle,
  Wifi,
  Sun,
  Moon,
} from "lucide-react";
import supabase from "../lib/supabaseClient";

interface Task {
  id: number;
  text: string;
  done: boolean;
  type: "daily" | "weekly" | "buy";
  added_by: string;
  last_updated_by?: string;
  last_modified: string;
  deleted?: boolean;
  user_id: string;
}

interface Props {
  user: any;
}

export default function MainTaskTracker({ user }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [type, setType] = useState<"daily" | "weekly" | "buy">("daily");
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "buy">("daily");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [syncing, setSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // ======================================================
  // Theme Handling
  // ======================================================
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // ======================================================
  // Fetch Tasks
  // ======================================================
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("last_modified", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return;
    }
    setTasks(data || []);
  };

  // ======================================================
  // Realtime Sync
  // ======================================================
  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ======================================================
  // CRUD Operations
  // ======================================================
  const addTask = async () => {
    if (!input.trim() || !addedBy.trim()) return;
    const { error } = await supabase.from("tasks").insert([
      {
        text: input.trim(),
        done: false,
        type,
        added_by: addedBy,
        user_id: user.id,
        last_updated_by: addedBy,
        last_modified: new Date().toISOString(),
      },
    ]);
    if (error) console.error("Add task failed:", error);
    else {
      setInput("");
      showTemporaryToast("✅ Task added");
    }
  };

  const toggleTask = async (task: Task) => {
    setSyncing(true);
    const { error } = await supabase
      .from("tasks")
      .update({
        done: !task.done,
        last_updated_by: addedBy || "Unknown",
        last_modified: new Date().toISOString(),
      })
      .eq("id", task.id)
      .eq("user_id", user.id);
    if (error) console.error("Toggle failed:", error);
    setSyncing(false);
  };

  const deleteTask = async (task: Task) => {
    setSyncing(true);
    const { error } = await supabase
      .from("tasks")
      .update({
        deleted: true,
        last_modified: new Date().toISOString(),
      })
      .eq("id", task.id)
      .eq("user_id", user.id);
    if (error) console.error("Delete failed:", error);
    else showTemporaryToast("🗑️ Task deleted");
    setSyncing(false);
  };

  const purgeDeleted = async () => {
    setSyncing(true);
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("deleted", true)
      .eq("user_id", user.id);
    if (error) console.error("Purge failed:", error);
    else showTemporaryToast("🧹 Deleted tasks purged");
    setSyncing(false);
  };

  // ======================================================
  // Toast Handler
  // ======================================================
  const showTemporaryToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // ======================================================
  // Filtered Tasks
  // ======================================================
  const filteredTasks = tasks.filter(
    (t) => t.type === activeTab && !t.deleted
  );

  const sections = [
    { label: "Daily", id: "daily", color: "#3aa0ff" },
    { label: "Weekly", id: "weekly", color: "#9b59b6" },
    { label: "Buy", id: "buy", color: "#44ff9a" },
  ];

  // ======================================================
  // Render
  // ======================================================
  return (
    <div className="space-y-8 p-4 relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-6 relative"
      >
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="absolute top-6 left-6 p-3 rounded-full bg-[#1e2229] text-white hover:scale-110 transition-transform"
          title="Toggle Theme"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <h1
          className="font-orbitron text-3xl md:text-4xl text-white mb-2 tracking-wide"
          style={{
            textShadow: "0 0 12px rgba(58,160,255,0.6)",
            background: "linear-gradient(to right, #3aa0ff, #9b59b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          AIBBRY’s Task Tracker
        </h1>
        <p className="text-gray-400 italic text-sm">
          {user.email} — synced via Supabase ☁️
        </p>
      </motion.div>

      {/* Input */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Add ${type} task...`}
          className="flex-1 p-3 rounded-lg bg-[#1e2229] text-white max-w-md"
        />
        <input
          value={addedBy}
          onChange={(e) => setAddedBy(e.target.value)}
          placeholder="Added by..."
          className="p-3 rounded-lg bg-[#1e2229] text-white"
          style={{ width: "130px" }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="p-3 rounded-lg bg-[#1e2229] text-white border border-gray-700"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button onClick={addTask} className="neon-button flex items-center gap-2">
          <PlusCircle size={18} /> Add
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 justify-center mb-6">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id as any)}
            className={`px-4 py-2 rounded-md font-orbitron uppercase tracking-wider transition-all duration-300 ${
              activeTab === s.id ? "bg-opacity-90" : "bg-opacity-20 hover:bg-opacity-30"
            }`}
            style={{
              backgroundColor: activeTab === s.id ? `${s.color}22` : "transparent",
              border: `1px solid ${s.color}55`,
              color: activeTab === s.id ? s.color : "#fff",
              boxShadow: activeTab === s.id ? `0 0 8px ${s.color}55` : "none",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div className="max-w-2xl mx-auto space-y-2">
        <AnimatePresence>
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="glass-card p-4 flex justify-between items-center"
            >
              <div>
                <span
                  onClick={() => toggleTask(task)}
                  className="cursor-pointer"
                  style={{
                    color: task.done ? "#aaaaaa" : "#ffffff",
                    textDecoration: task.done ? "line-through" : "none",
                  }}
                >
                  {task.text}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Added by:{" "}
                  <span className="text-[#3aa0ff]">{task.added_by}</span>{" "}
                  {task.last_updated_by && (
                    <>
                      • Updated by:{" "}
                      <span className="text-[#9b59b6]">{task.last_updated_by}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => toggleTask(task)}
                  className="hover:scale-110 transition-transform"
                >
                  <CheckCircle
                    size={20}
                    className={task.done ? "text-[#44ff9a]" : "text-gray-400"}
                  />
                </button>
                <button
                  onClick={() => deleteTask(task)}
                  className="hover:scale-110 transition-transform"
                >
                  <Trash2 size={20} className="text-[#ff6b6b]" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Purge Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={purgeDeleted}
          className="neon-button flex items-center gap-2 bg-[#ff6b6b22] hover:bg-[#ff6b6b33]"
        >
          🧹 Purge Deleted
        </button>
      </div>

      {/* Toasts */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-6 right-6 bg-[#1e1f26dd] border border-[#44ff9a55] px-4 py-2 rounded-lg shadow-lg text-white font-orbitron text-sm backdrop-blur-md"
            style={{ textShadow: "0 0 8px #44ff9a" }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {syncing && (
        <div className="fixed bottom-6 left-6 bg-[#1e1f26dd] text-white p-3 rounded-lg border border-[#44ff9a55] font-orbitron text-sm backdrop-blur-md shadow-lg flex items-center gap-2">
          <Wifi size={16} className="text-[#44ff9a]" /> Syncing...
        </div>
      )}
    </div>
  );
}
