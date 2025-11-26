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
  Eraser,
  Sun,
  Moon,
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
  const [toastMessage, setToastMessage] = useState("☁ Synced just now");
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [syncHistory, setSyncHistory] = useState<{ time: number; status: string }[]>([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastInteraction = useRef<number>(Date.now());

  const blobUploadAPI = "/api/uploadBlob";
  const [blobPublicFile, setBlobPublicFile] = useState<string>(
    () =>
      localStorage.getItem("blobPublicFile") ||
      "https://ncb7nshm67uygsmd.public.blob.vercel-storage.com/tasks-latest.json"
  );

  const deviceId = useRef<string>(
    localStorage.getItem("deviceId") || crypto.randomUUID()
  );
  useEffect(() => localStorage.setItem("deviceId", deviceId.current), []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (tasks.length > 0) {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => autoSaveToBlob(), 2000);
    }
  }, [tasks]);

  useEffect(() => {
    const scheduleSync = () => {
      const now = Date.now();
      const idle = now - lastInteraction.current > 20000;
      const interval = idle ? 20000 : 7000;
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
        ? { ...t, done: !t.done, lastUpdatedBy: addedBy || "Unknown", lastModified: Date.now() }
        : t
    );
    setTasks(updatedTasks);
  };

  const deleteTask = (id: number) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? { ...t, deleted: true, lastUpdatedBy: addedBy || "Unknown", lastModified: Date.now() }
        : t
    );
    setTasks(updatedTasks);
  };

  const purgeDeleted = async () => {
    const cleaned = tasks.filter((t) => !t.deleted);
    setTasks(cleaned);
    await saveTasksToBlob(false);
    alert("🧹 Deleted tasks permanently removed.");
  };

  const restoreTasksFromBlob = async () => {
    if (!restoreURL.trim()) return alert("❌ Enter a valid backup URL first.");
    setRestoring(true);
    try {
      const res = await fetch(restoreURL);
      if (!res.ok) throw new Error("Failed to fetch backup file.");
      const data: Task[] = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
        alert("✅ Tasks restored successfully!");
      } else alert("❌ Backup file format invalid.");
    } catch (err) {
      console.error(err);
      alert("❌ Restore failed.");
    } finally {
      setRestoring(false);
    }
  };

  const sections = [
    { label: "Daily Tasks", id: "daily", color: "#3aa0ff", list: tasks.filter((t) => t.type === "daily" && (showDeleted || !t.deleted)) },
    { label: "Weekly Goals", id: "weekly", color: "#9b59b6", list: tasks.filter((t) => t.type === "weekly" && (showDeleted || !t.deleted)) },
    { label: "Things to Buy", id: "buy", color: "#44ff9a", list: tasks.filter((t) => t.type === "buy" && (showDeleted || !t.deleted)) },
  ];
  const activeSection = sections.find((s) => s.id === activeTab)!;

  const saveTasksToBlob = async (silent = false) => {
    if (tasks.length === 0) return;
    setUploading(true);
    try {
      const payload = {
        meta: { deviceId: deviceId.current, lastSyncedAt: Date.now() },
        tasks,
      };
      const res = await fetch(blobUploadAPI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "tasks-latest.json",
          content: JSON.stringify(payload, null, 2),
        }),
      });
      const data = await res.json();
      if (data.url) {
        setSynced(true);
        setLastSynced(Date.now());
        localStorage.setItem("blobPublicFile", data.url);
        setBlobPublicFile(data.url);
        setSyncHistory((prev) => [{ time: Date.now(), status: "success" }, ...prev.slice(0, 4)]);
        if (!silent) {
          setToastMessage("☁ Cloud backup saved.");
          triggerSyncToast();
        }
      }
    } catch (e) {
      console.error(e);
      setSynced(false);
    } finally {
      setUploading(false);
    }
  };

  const autoSaveToBlob = async () => await saveTasksToBlob(true);

  const fetchLatestFromBlob = async () => {
    try {
      const res = await fetch(blobPublicFile + "?_=" + Date.now());
      if (!res.ok) return;
      const cloudPackage = await res.json();
      const cloudData: Task[] = cloudPackage.tasks || [];
      const mergedMap = new Map<number, Task>();
      [...tasks, ...cloudData].forEach((t) => {
        const existing = mergedMap.get(t.id);
        if (!existing) mergedMap.set(t.id, t);
        else {
          const newer = t.lastModified > existing.lastModified ? t : existing;
          if (t.deleted || existing.deleted) mergedMap.set(t.id, { ...newer, deleted: true });
          else mergedMap.set(t.id, newer);
        }
      });
      const merged = Array.from(mergedMap.values());
      if (JSON.stringify(merged) !== JSON.stringify(tasks)) {
        setTasks(merged);
        setToastMessage("⚡ Remote changes merged.");
        triggerSyncToast();
        await saveTasksToBlob(true);
      }
    } catch (err) {
      console.error("Cloud fetch failed:", err);
      setSynced(false);
    }
  };

  const triggerSyncToast = () => {
    setShowSyncToast(true);
    setTimeout(() => setShowSyncToast(false), 3000);
  };

  return (
    <div className="relative space-y-8">
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
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-300" />}
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
        <p className="text-gray-300 italic text-base tracking-wide">
          Quantum-synced across all your devices ☁️⚡
        </p>

        <div className="absolute top-6 right-6">
          <div className="relative">
            <button
              onClick={() => setShowCloudPanel((v) => !v)}
              className={`p-3 rounded-full cloud-glow ${uploading ? "syncing" : !synced ? "error" : ""}`}
              title="Cloud Options"
            >
              <Cloud size={24} className="text-white" />
            </button>

        <AnimatePresence>
          {showCloudPanel && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25 }}
              className="absolute right-0 mt-3 w-64 bg-[#1a1d22ee] border border-gray-700 rounded-xl shadow-lg backdrop-blur-md p-3 z-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-orbitron text-sm text-gray-300 tracking-wider flex items-center gap-2">
                  Cloud Sync{" "}
                  <Wifi
                    size={14}
                    className={synced ? "text-[#44ff9a]" : "text-[#ff6b6b]"}
                  />
                </h4>
                <button
                  onClick={() => setShowCloudPanel(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              </div>

              {lastSynced && (
                <p className="text-xs text-gray-400 font-mono mb-2">
                  Last synced:{" "}
                  <span className="text-[#44ff9a]">
                    {new Date(lastSynced).toLocaleTimeString()}
                  </span>
                </p>
              )}

              <button
                onClick={() => saveTasksToBlob(false)}
                disabled={uploading}
                className="neon-button flex items-center justify-center gap-2 w-full mb-2"
              >
                <CloudUpload size={16} />
                {uploading ? "Uploading..." : "Save Backup"}
              </button>

              <input
                type="text"
                value={restoreURL}
                onChange={(e) => setRestoreURL(e.target.value)}
                placeholder="Paste backup URL..."
                className="w-full p-2 rounded bg-[#1e2229] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#44ff9a] mb-2"
              />
              <button
                onClick={restoreTasksFromBlob}
                disabled={restoring}
                className="neon-button flex items-center justify-center gap-2 w-full bg-[#44ff9a22] mb-2"
              >
                <CloudDownload size={16} />
                {restoring ? "Restoring..." : "Restore"}
              </button>

              <label className="flex items-center gap-2 text-gray-300 text-xs cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="accent-[#44ff9a] w-4 h-4"
                />
                Show deleted
              </label>

              <button
                onClick={purgeDeleted}
                className="neon-button flex items-center justify-center gap-2 w-full bg-[#ff6b6b22] hover:bg-[#ff6b6b33]"
              >
                <Eraser size={16} /> Purge Deleted
              </button>

              {syncHistory.length > 0 && (
                <div className="mt-3 border-t border-gray-700 pt-2">
                  <p className="text-xs text-gray-400 mb-1">Recent Syncs:</p>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </motion.div>

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

  <div className="flex gap-3 justify-center mb-6">
    {["daily", "weekly", "buy"].map((tab) => {
      const section = sections.find((s) => s.id === tab)!;
      return (
        <button
          key={tab}
          onClick={() => setActiveTab(tab as any)}
          className={`px-4 py-2 rounded-md font-orbitron uppercase tracking-wider transition-all duration-300 ${
            activeTab === tab ? "bg-opacity-90" : "bg-opacity-20 hover:bg-opacity-30"
          }`}
          style={{
            backgroundColor: activeTab === tab ? `${section.color}22` : "transparent",
            border: `1px solid ${section.color}55`,
            color: activeTab === tab ? section.color : "#fff",
            boxShadow: activeTab === tab ? `0 0 8px ${section.color}55` : "none",
          }}
        >
          {section.label.split(" ")[0]}
        </button>
      );
    })}
  </div>

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
                textShadow: task.done ? "none" : "0 0 6px rgba(255,255,255,0.4)",
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
                  <span className="text-[#9b59b6]">{task.lastUpdatedBy}</span>
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
                    className={task.done ? "text-[#44ff9a]" : "text-gray-400"}
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
        {toastMessage}
      </motion.div>
    )}
  </AnimatePresence>
</div>

);
}