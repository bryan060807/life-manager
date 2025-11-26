import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Trash2,
  CheckCircle,
  Cloud,
  CloudUpload,
  CloudDownload,
  X,
  Wifi,
} from "lucide-react";

interface Task {
  id: number;
  text: string;
  done: boolean;
  type: "daily" | "weekly" | "buy";
  addedBy: string;
  lastUpdatedBy?: string;
}

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [type, setType] = useState<"daily" | "weekly" | "buy">("daily");
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "buy">("daily");
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreURL, setRestoreURL] = useState("");
  const [showCloudPanel, setShowCloudPanel] = useState(false);
  const [synced, setSynced] = useState(true);

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const blobURL = "/api/uploadBlob"; // Replace with your Vercel Blob endpoint if needed

  // 🧠 Save to localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // 💾 Auto-save debounce
  useEffect(() => {
    if (tasks.length > 0) {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => autoSaveToBlob(), 2000);
    }
  }, [tasks]);

  // ☁️ Auto-fetch updates from Blob every 5 seconds
  useEffect(() => {
    syncInterval.current = setInterval(fetchLatestFromBlob, 5000);
    return () => {
      if (syncInterval.current) clearInterval(syncInterval.current);
    };
  }, []);

  const addTask = () => {
    if (!input.trim() || !addedBy.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      text: input,
      done: false,
      type,
      addedBy,
    };
    setTasks([...tasks, newTask]);
    setInput("");
  };

  const toggleTask = (id: number) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done, lastUpdatedBy: addedBy || "Unknown" } : t
    );
    setTasks(updatedTasks);
  };

  const deleteTask = (id: number) => setTasks(tasks.filter((t) => t.id !== id));

  const dailyTasks = tasks.filter((t) => t.type === "daily");
  const weeklyTasks = tasks.filter((t) => t.type === "weekly");
  const buyTasks = tasks.filter((t) => t.type === "buy");

  const sections = [
    { label: "Daily Tasks", id: "daily", color: "#3aa0ff", list: dailyTasks },
    { label: "Weekly Goals", id: "weekly", color: "#9b59b6", list: weeklyTasks },
    { label: "Things to Buy", id: "buy", color: "#44ff9a", list: buyTasks },
  ];

  const activeSection = sections.find((s) => s.id === activeTab)!;

  // 💾 Manual save to Vercel Blob
  const saveTasksToBlob = async (silent = false) => {
    if (tasks.length === 0) {
      if (!silent) alert("❌ No tasks to backup.");
      return;
    }

    setUploading(true);
    try {
      const filename = `tasks-latest.json`;

      const res = await fetch(blobURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          content: JSON.stringify(tasks, null, 2),
        }),
      });

      const data = await res.json();
      if (!silent && data.url) {
        alert(`✅ Tasks backed up successfully!\n${data.url}`);
      }
      setSynced(true);
    } catch (error) {
      console.error("Upload failed:", error);
      if (!silent) alert("❌ Upload failed. Check console for details.");
      setSynced(false);
    } finally {
      setUploading(false);
    }
  };

  // 🔁 Auto-save handler
  const autoSaveToBlob = async () => {
    await saveTasksToBlob(true);
    console.log("☁️ Auto-synced tasks to cloud.");
  };

  // ☁️ Fetch latest cloud data
  const fetchLatestFromBlob = async () => {
    try {
      const res = await fetch("/api/tasks-latest.json"); // If Blob is public, use its URL directly
      if (!res.ok) return;
      const cloudData: Task[] = await res.json();

      // Compare and update only if newer
      const localHash = JSON.stringify(tasks);
      const remoteHash = JSON.stringify(cloudData);
      if (localHash !== remoteHash) {
        setTasks(cloudData);
        setSynced(true);
        console.log("🛰 Cloud sync updated local tasks");
      }
    } catch (err) {
      console.error("Cloud fetch failed:", err);
      setSynced(false);
    }
  };

  // ☁️ Manual restore
  const restoreTasksFromBlob = async () => {
    if (!restoreURL.trim()) {
      alert("❌ Please enter a valid backup URL first.");
      return;
    }

    setRestoring(true);
    try {
      const res = await fetch(restoreURL);
      if (!res.ok) throw new Error("Failed to fetch backup file.");
      const data: Task[] = await res.json();

      if (Array.isArray(data)) {
        setTasks(data);
        alert("✅ Tasks restored successfully!");
      } else {
        alert("❌ Backup file format invalid.");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Restore failed. Check console for details.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-6"
      >
        <h1
          className="font-orbitron text-3xl md:text-4xl text-white mb-2 tracking-wide"
          style={{
            textShadow: "0 0 12px rgba(58, 160, 255, 0.6)",
            background: "linear-gradient(to right, #3aa0ff, #9b59b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          AIBBRY’s Task Tracker
        </h1>
        <p className="text-gray-300 italic text-base tracking-wide">
          Shared task list synced through the cloud 🧠☁️
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-3 justify-center mb-6">
        {sections.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "daily" | "weekly" | "buy")}
            className={`px-4 py-2 rounded-md font-orbitron uppercase tracking-wider transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-opacity-90"
                : "bg-opacity-20 hover:bg-opacity-30"
            }`}
            style={{
              backgroundColor:
                activeTab === tab.id ? `${tab.color}22` : "transparent",
              border:
                activeTab === tab.id
                  ? `1px solid ${tab.color}55`
                  : "1px solid rgba(255,255,255,0.1)",
              color: activeTab === tab.id ? tab.color : "#ffffff",
              boxShadow:
                activeTab === tab.id
                  ? `0 0 8px ${tab.color}55`
                  : "none",
            }}
          >
            {tab.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Add ${type} item...`}
          className="flex-1 p-3 rounded-lg bg-[#1e2229] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3aa0ff] max-w-md"
        />
        <input
          value={addedBy}
          onChange={(e) => setAddedBy(e.target.value)}
          placeholder="Added by..."
          className="p-3 rounded-lg bg-[#1e2229] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9b59b6]"
          style={{ width: "130px" }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "daily" | "weekly" | "buy")}
          className="p-3 rounded-lg bg-[#1e2229] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3aa0ff]"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="buy">Buy</option>
        </select>
        <button
          onClick={addTask}
          className="neon-button flex items-center gap-2 hover:scale-105 transition-transform duration-200"
        >
          <PlusCircle size={18} /> Add
        </button>
      </div>

      {/* Task Section */}
      <motion.div
        key={activeSection.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <h3
          className="font-orbitron text-xl mb-4 text-center"
          style={{
            color: activeSection.color,
            textShadow: `0 0 10px ${activeSection.color}66`,
          }}
        >
          {activeSection.label}
        </h3>

        <AnimatePresence>
          {activeSection.list.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="glass-card p-4 flex justify-between items-center mb-2"
            >
              <div>
                <span
                  onClick={() => toggleTask(task.id)}
                  className="cursor-pointer select-none transition-all duration-200 block"
                  style={{
                    color: task.done ? "#aaaaaa" : "#ffffff",
                    textShadow: task.done
                      ? "none"
                      : "0 0 6px rgba(255,255,255,0.4)",
                    fontWeight: 500,
                  }}
                >
                  {task.text}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Added by: <span className="text-[#3aa0ff]">{task.addedBy}</span>{" "}
                  {task.lastUpdatedBy && (
                    <>
                      • Updated by:{" "}
                      <span className="text-[#9b59b6]">{task.lastUpdatedBy}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="hover:scale-110 transition-transform"
                >
                  <CheckCircle
                    size={20}
                    className={
                      task.done ? "text-[#44ff9a]" : "text-gray-400"
                    }
                  />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="hover:scale-110 transition-transform"
                >
                  <Trash2 size={20} className="text-[#ff6b6b]" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* 🌐 Floating Cloud Control Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          initial={false}
          animate={{
            width: showCloudPanel ? 300 : 56,
            height: showCloudPanel ? "auto" : 56,
          }}
          transition={{ duration: 0.3 }}
          className="bg-[#1a1d22cc] backdrop-blur-md border border-gray-700 rounded-2xl shadow-lg p-3 overflow-hidden"
        >
          {showCloudPanel ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-orbitron text-sm text-gray-300 tracking-wider flex items-center gap-2">
                  Cloud Backup{" "}
                  <Wifi
                    size={14}
                    className={synced ? "text-[#44ff9a]" : "text-[#ff6b6b]"}
                    title={synced ? "Synced" : "Out of Sync"}
                  />
                </h4>
                <button
                  onClick={() => setShowCloudPanel(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>

              <button
                onClick={() => saveTasksToBlob(false)}
                disabled={uploading}
                className="neon-button flex items-center justify-center gap-2 w-full"
              >
                <CloudUpload size={16} />
                {uploading ? "Uploading..." : "Save Backup"}
              </button>

              <input
                type="text"
                value={restoreURL}
                onChange={(e) => setRestoreURL(e.target.value)}
                placeholder="Paste backup URL..."
                className="w-full p-2 rounded bg-[#1e2229] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#44ff9a]"
              />

              <button
                onClick={restoreTasksFromBlob}
                disabled={restoring}
                className="neon-button flex items-center justify-center gap-2 w-full bg-[#44ff9a22]"
              >
                <CloudDownload size={16} />
                {restoring ? "Restoring..." : "Restore"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCloudPanel(true)}
              className="flex items-center justify-center text-white cloud-glow"
              title="Open Cloud Backup"
            >
              <Cloud size={26} />
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
