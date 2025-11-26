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

        console.log("✅ Synced to:", data.url);
        localStorage.setItem("blobPublicFile", data.url);
        setBlobPublicFile(data.url);
        setSynced(true);
        if (!silent) alert(`✅ Tasks backed up successfully!\n${data.url}`);
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

  const autoSaveToBlob = async () => {
    await saveTasksToBlob(true);
    console.log("☁️ Auto-synced tasks to cloud.");
  };

  const fetchLatestFromBlob = async () => {
    try {
      const res = await fetch(blobPublicFile + "?_=" + Date.now());
      if (!res.ok) return;

      const cloudData: Task[] = await res.json();
      const mergedMap = new Map<number, Task>();

      const allTasks = [...tasks, ...cloudData];
      for (const t of allTasks) {
        const existing = mergedMap.get(t.id);
        if (!existing || t.lastModified > existing.lastModified) {
          mergedMap.set(t.id, t);
        }
      }

      const merged = Array.from(mergedMap.values());
      const visibleTasks = merged.filter((t) => !t.deleted);

      const mergedString = JSON.stringify(visibleTasks);
      if (mergedString !== JSON.stringify(tasks)) {
        setTasks(visibleTasks);
        setSynced(true);
        triggerSyncToast();
        const now = Date.now();
        setLastSynced(now);
        setSyncHistory((prev) => [
          { time: now, status: "success" },
          ...prev.slice(0, 4),
        ]);
        console.log("🔄 Merged cloud + local tasks successfully (deletion-safe)");
      }
    } catch (err) {
      console.error("Cloud fetch failed:", err);
      setSynced(false);
      const now = Date.now();
      setSyncHistory((prev) => [
        { time: now, status: "error" },
        ...prev.slice(0, 4),
      ]);
    }
  };

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
      } else alert("❌ Backup file format invalid.");
    } catch (err) {
      console.error(err);
      alert("❌ Restore failed.");
    } finally {
      setRestoring(false);
    }
  };

  const triggerSyncToast = () => {
    setShowSyncToast(true);
    setTimeout(() => setShowSyncToast(false), 2500);
  };

  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const cleaned = tasks.filter(
        (t) => !(t.deleted && now - t.lastModified > 24 * 60 * 60 * 1000)
      );
      if (cleaned.length !== tasks.length) setTasks(cleaned);
    };
    const interval = setInterval(cleanup, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  return (
    <div className="space-y-8">
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
          Synced across your devices in real-time ☁️💫
        </p>
      </motion.div>

      {/* ===== Cloud Panel ===== */}
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

              {/* === Sync Info Display === */}
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

              {/* === Mini Sync History === */}
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
