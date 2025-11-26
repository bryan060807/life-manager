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
  lastModified: number;
  deleted?: boolean;
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
  const [showDeleted, setShowDeleted] = useState(false);
  const [synced, setSynced] = useState(true);
  const [showSyncToast, setShowSyncToast] = useState(false);

  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [syncHistory, setSyncHistory] = useState<{ time: number; status: string }[]>([]);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastInteraction = useRef<number>(Date.now());

  const blobUploadAPI = "/api/uploadBlob";
  const [blobPublicFile, setBlobPublicFile] = useState<string>(
    () =>
      localStorage.getItem("blobPublicFile") ||
      "https://ncb7nshm67uygsmd.public.blob.vercel-storage.com/tasks-latest.json"
  );

  /* === Local storage persistence === */
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  /* === Autosave debounce === */
  useEffect(() => {
    if (tasks.length > 0) {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => autoSaveToBlob(), 2000);
    }
  }, [tasks]);

  /* === Adaptive sync loop === */
  useEffect(() => {
    const scheduleSync = () => {
      const now = Date.now();
      const idle = now - lastInteraction.current > 20000;
      const interval = idle ? 20000 : 5000;
      if (syncInterval.current) clearInterval(syncInterval.current);
      syncInterval.current = setInterval(fetchLatestFromBlob, interval);
    };
    scheduleSync();
    document.addEventListener("click", () => {
      lastInteraction.current = Date.now();
      scheduleSync();
    });
    return () => {
      if (syncInterval.current) clearInterval(syncInterval.current);
      document.removeEventListener("click", () => ({}));
    };
  }, [blobPublicFile]);

  /* === Core functions === */
  const addTask = () => {
    if (!input.trim() || !addedBy.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      text: input,
      done: false,
      type,
      addedBy,
      lastUpdatedBy: addedBy,
      lastModified: Date.now(),
    };
    setTasks([...tasks, newTask]);
    setInput("");
  };

  const toggleTask = (id: number) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            done: !t.done,
            lastUpdatedBy: addedBy || "Unknown",
            lastModified: Date.now(),
          }
        : t
    );
    setTasks(updatedTasks);
  };

  const deleteTask = (id: number) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            deleted: true,
            lastUpdatedBy: addedBy || "Unknown",
            lastModified: Date.now(),
          }
        : t
    );
    setTasks(updatedTasks);
  };

  const dailyTasks = tasks.filter(
    (t) => t.type === "daily" && (showDeleted || !t.deleted)
  );
  const weeklyTasks = tasks.filter(
    (t) => t.type === "weekly" && (showDeleted || !t.deleted)
  );
  const buyTasks = tasks.filter(
    (t) => t.type === "buy" && (showDeleted || !t.deleted)
  );

  const sections = [
    { label: "Daily Tasks", id: "daily", color: "#3aa0ff", list: dailyTasks },
    { label: "Weekly Goals", id: "weekly", color: "#9b59b6", list: weeklyTasks },
    { label: "Things to Buy", id: "buy", color: "#44ff9a", list: buyTasks },
  ];
  const activeSection = sections.find((s) => s.id === activeTab)!;

  /* === Cloud functions === */
  const saveTasksToBlob = async (silent = false) => {
    if (tasks.length === 0) {
      if (!silent) alert("❌ No tasks to backup.");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch(blobUploadAPI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "tasks-latest.json",
          content: JSON.stringify(tasks, null, 2),
        }),
      });
      const data = await res.json();
      if (data.url) {
        const now = Date.now();
        setLastSynced(now);
        setSyncHistory((prev) => [
          { time: now, status: "success" },
          ...prev.slice(0, 4),
        ]);

        localStorage.setItem("blobPublicFile", data.url);
        setBlobPublicFile(data.url);
        setSynced(true);
      }
    } catch (e) {
      console.error(e);
      setSynced(false);
      const now = Date.now();
      setSyncHistory((prev) => [
        { time: now, status: "error" },
        ...prev.slice(0, 4),
      ]);
    } finally {
      setUploading(false);
    }
  };

  const autoSaveToBlob = async () => await saveTasksToBlob(true);

  const fetchLatestFromBlob = async () => {
    try {
      const res = await fetch(blobPublicFile + "?_=" + Date.now());
      if (!res.ok) return;

      const cloudData: Task[] = await res.json();
      const mergedMap = new Map<number, Task>();

      [...tasks, ...cloudData].forEach((t) => {
        const existing = mergedMap.get(t.id);
        if (!existing || t.lastModified > existing.lastModified) mergedMap.set(t.id, t);
      });

      const merged = Array.from(mergedMap.values());
      const visible = merged.filter((t) => !t.deleted);
      if (JSON.stringify(visible) !== JSON.stringify(tasks)) {
        setTasks(visible);
        setSynced(true);
        triggerSyncToast();
        const now = Date.now();
        setLastSynced(now);
        setSyncHistory((prev) => [
          { time: now, status: "success" },
          ...prev.slice(0, 4),
        ]);
      }
    } catch (err) {
      console.error("Cloud fetch failed:", err);
      setSynced(false);
    }
  };

  const triggerSyncToast = () => {
    setShowSyncToast(true);
    setTimeout(() => setShowSyncToast(false), 2500);
  };

  /* === UI === */
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
            textShadow: "0 0 12px rgba(58,160,255,0.6)",
            background: "linear-gradient(to right, #3aa0ff, #9b59b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          AIBBRY’s Task Tracker
        </h1>
        <p className="text-gray-300 italic text-base tracking-wide">
          Synced across your devices in real-time ☁️💫
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-3 justify-center mb-6">
        {sections.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md font-orbitron uppercase tracking-wider transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-opacity-90"
                : "bg-opacity-20 hover:bg-opacity-30"
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? `${tab.color}22` : "transparent",
              border: `1px solid ${tab.color}55`,
              color: activeTab === tab.id ? tab.color : "#fff",
              boxShadow:
                activeTab === tab.id ? `0 0 8px ${tab.color}55` : "none",
            }}
          >
            {tab.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Input Bar */}
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
          onChange={(e) => setType(e.target.value as any)}
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

      {/* Task List */}
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
                  onClick={() => !task.deleted && toggleTask(task.id)}
                  className={`cursor-pointer select-none transition-all duration-200 block ${
                    task.deleted ? "line-through opacity-40" : ""
                  }`}
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
                  Added by:{" "}
                  <span className="text-[#3aa0ff]">{task.addedBy}</span>{" "}
                  {task.lastUpdatedBy && (
                    <>
                      • Updated by:{" "}
                      <span className="text-[#9b59b6]">
                        {task.lastUpdatedBy}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                {!task.deleted ? (
                  <>
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
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const restored = tasks.map((t) =>
                        t.id === task.id
                          ? { ...t, deleted: false, lastModified: Date.now() }
                          : t
                      );
                      setTasks(restored);
                    }}
                    className="hover:scale-110 transition-transform"
                    title="Restore deleted task"
                  >
                    <CheckCircle size={20} className="text-[#44ff9a]" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Cloud Panel */}
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
                  <span title={synced ? "Synced" : "Out of Sync"}>
                    <Wifi
                      size={14}
                      className={synced ? "text-[#44ff9a]" : "text-[#ff6b6b]"}
                    />
                  </span>
                </h4>
                <button
                  onClick={() => setShowCloudPanel(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>

              {lastSynced && (
                <p className="text-xs text-gray-400 font-mono">
                  Last synced:{" "}
                  <motion.span
                    key={lastSynced}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-[#44ff9a]"
                  >
                    {new Date(lastSynced).toLocaleTimeString()}
                  </motion.span>
                </p>
              )}

              {syncHistory.length > 0 && (
                <div className="mt-2 border-t border-gray-700 pt-2">
                  <p className="text-xs text-gray-400 mb-1">Sync History:</p>
                  <div className="max-h-20 overflow-y-auto text-xs font-mono text-gray-300 space-y-1">
                    {syncHistory.map((entry, i) => (
                      <div key={i}>
                        <span
                          className={`${
                            entry.status === "success"
                              ? "text-[#44ff9a]"
                              : "text-[#ff6b6b]"
                          }`}
                        >
                          {entry.status.toUpperCase()}
                        </span>{" "}
                        — {new Date(entry.time).toLocaleTimeString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                onClick={() => restoreTasksFromBlob()}
                disabled={restoring}
                className="neon-button flex items-center justify-center gap-2 w-full bg-[#44ff9a22]"
              >
                <CloudDownload size={16} />
                {restoring ? "Restoring..." : "Restore"}
              </button>

              <label className="flex items-center gap-2 text-gray-300 text-xs cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="accent-[#44ff9a] w-4 h-4"
                />
                Show deleted tasks
              </label>
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

      <AnimatePresence>
        {showSyncToast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-24 right-6 bg-[#1e1f26dd] border border-[#44ff9a55] px-4 py-2 rounded-lg shadow-lg text-white font-orbitron text-sm backdrop-blur-md"
            style={{ textShadow: "0 0 8px #44ff9a" }}
          >
            ☁ Synced just now
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
