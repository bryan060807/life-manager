import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Trash2, CheckCircle, CloudUpload, CloudDownload } from "lucide-react";

interface Task {
  id: number;
  text: string;
  done: boolean;
  type: "daily" | "weekly" | "buy";
}

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [type, setType] = useState<"daily" | "weekly" | "buy">("daily");
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "buy">("daily");
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreURL, setRestoreURL] = useState("");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!input.trim()) return;
    const newTask: Task = { id: Date.now(), text: input, done: false, type };
    setTasks([...tasks, newTask]);
    setInput("");
  };

  const toggleTask = (id: number) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTask = (id: number) =>
    setTasks(tasks.filter((t) => t.id !== id));

  const dailyTasks = tasks.filter((t) => t.type === "daily");
  const weeklyTasks = tasks.filter((t) => t.type === "weekly");
  const buyTasks = tasks.filter((t) => t.type === "buy");

  const sections = [
    { label: "Daily Tasks", id: "daily", color: "#3aa0ff", list: dailyTasks },
    { label: "Weekly Goals", id: "weekly", color: "#9b59b6", list: weeklyTasks },
    { label: "Things to Buy", id: "buy", color: "#44ff9a", list: buyTasks },
  ];

  const activeSection = sections.find((s) => s.id === activeTab)!;

  // 💾 Upload tasks to Vercel Blob Storage
  const saveTasksToBlob = async () => {
    if (tasks.length === 0) {
      alert("❌ No tasks to backup.");
      return;
    }

    setUploading(true);
    try {
      const filename = `tasks-${Date.now()}.json`;

      const res = await fetch("/api/uploadBlob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          content: JSON.stringify(tasks, null, 2),
        }),
      });

      const data = await res.json();

      if (data.url) {
        alert(`✅ Tasks backed up successfully!\n${data.url}`);
      } else {
        alert("❌ Failed to save tasks to cloud.");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  // ☁️ Restore tasks from a Blob backup URL
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
      {/* Header Title */}
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
          Designed to help you get your shit together. Finally…
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
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as "daily" | "weekly" | "buy")
          }
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

      {/* Active Section */}
      <motion.div
        key={activeSection.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
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
              <span
                onClick={() => toggleTask(task.id)}
                className="cursor-pointer select-none transition-all duration-200"
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

        {activeSection.list.length === 0 && (
          <p className="text-gray-400 text-sm italic text-center">
            No items yet — add one above.
          </p>
        )}

        {/* Cloud Backup Controls */}
        <div className="text-center mt-10 space-y-4">
          <button
            onClick={saveTasksToBlob}
            disabled={uploading}
            className="neon-button flex items-center justify-center gap-2 mx-auto"
          >
            <CloudUpload size={18} />
            {uploading ? "Uploading..." : "Save Backup to Cloud"}
          </button>

          <div className="flex flex-col items-center gap-2 mt-4">
            <input
              type="text"
              value={restoreURL}
              onChange={(e) => setRestoreURL(e.target.value)}
              placeholder="Paste cloud backup URL here..."
              className="w-full max-w-md p-3 rounded-lg bg-[#1e2229] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#44ff9a]"
            />
            <button
              onClick={restoreTasksFromBlob}
              disabled={restoring}
              className="neon-button flex items-center justify-center gap-2 mx-auto bg-[#44ff9a22]"
            >
              <CloudDownload size={18} />
              {restoring ? "Restoring..." : "Restore from Cloud"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
