import { useState, useEffect } from "react";
import { motion, AnimatePresence, createPortal } from "framer-motion";
import {
  PlusCircle,
  Trash2,
  CheckCircle,
  Wifi,
  MoreVertical,
  RefreshCcw,
  LogOut,
  XCircle,
  Clock,
  User,
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
}

interface Props {
  user: any;
  onSignOut?: () => void;
}

export default function MainTaskTracker({ user, onSignOut }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [type, setType] = useState<"daily" | "weekly" | "buy">("daily");
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "buy">("daily");
  const [syncing, setSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // ======================================================
  // Fetch + Sync
  // ======================================================
  const fetchTasks = async () => {
    setSyncing(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("last_modified", { ascending: false });

    if (!error) {
      setTasks(data || []);
      setLastSynced(new Date());
    } else console.error("Fetch error:", error);
    setSyncing(false);
  };

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () =>
        fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        last_updated_by: addedBy,
        last_modified: new Date().toISOString(),
      },
    ]);
    if (error) console.error("Add task failed:", error);
    else {
      setInput("");
      showToastMsg("✅ Task added");
      fetchTasks();
    }
  };

  const toggleTask = async (task: Task) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        done: !task.done,
        last_updated_by: addedBy || "Unknown",
        last_modified: new Date().toISOString(),
      })
      .eq("id", task.id);
    if (error) console.error("Toggle failed:", error);
    else fetchTasks();
  };

  const deleteTask = async (task: Task) => {
    const { error } = await supabase
      .from("tasks")
      .update({ deleted: true, last_modified: new Date().toISOString() })
      .eq("id", task.id);
    if (error) console.error("Delete failed:", error);
    else showToastMsg("🗑️ Task deleted");
  };

  const purgeDeleted = async () => {
    const { error } = await supabase.from("tasks").delete().eq("deleted", true);
    if (error) console.error("Purge failed:", error);
    else showToastMsg("🧹 Deleted tasks purged");
  };

  const refreshSync = () => {
    showToastMsg("🔄 Refreshing sync...");
    fetchTasks();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut?.();
  };

  const showToastMsg = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const filteredTasks = tasks.filter((t) => t.type === activeTab && !t.deleted);

  const sections = [
    { label: "Daily", id: "daily", color: "#3aa0ff" },
    { label: "Weekly", id: "weekly", color: "#9b59b6" },
    { label: "Buy", id: "buy", color: "#44ff9a" },
  ];

  const formatLastSync = (date: Date | null) =>
    date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not yet synced";

  // ======================================================
  // HUD Portal (always at viewport top-right)
  // ======================================================
  const hud = (
    <div
      className="fixed top-4 right-4 z-[99999] flex items-center gap-3"
      style={{
        pointerEvents: "auto",
        position: "fixed",
        top: "1rem",
        right: "1rem",
      }}
    >
      <div className="glass-card px-4 py-2 flex items-center gap-2 text-sm text-gray-300 shadow-lg backdrop-blur-md border border-gray-700 rounded-xl">
        <User size={16} className="text-[#44ff9a]" />
        <span className="font-mono truncate max-w-[180px]">{user.email}</span>
        <span className="text-gray-500 text-xs ml-1">
          • <Clock size={12} className="inline text-[#44ff9a]" /> {formatLastSync(lastSynced)}
        </span>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="p-2 rounded-full bg-[#1e2229] text-white hover:bg-[#2b2f37] shadow-md transition-all"
          title="Open Menu"
        >
          <MoreVertical size={18} />
        </button>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 bg-[#1c1e24] border border-gray-700 rounded-lg shadow-lg py-2 w-48 z-50"
          >
            <button
              onClick={() => {
                purgeDeleted();
                setMenuOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-left text-gray-200 hover:bg-[#2a2d34] transition"
            >
              <XCircle size={16} className="mr-2 text-[#ff6b6b]" /> Purge Deleted
            </button>
            <button
              onClick={() => {
                refreshSync();
                setMenuOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-left text-gray-200 hover:bg-[#2a2d34] transition"
            >
              <RefreshCcw size={16} className="mr-2 text-[#3aa0ff]" /> Refresh Sync
            </button>
            <button
              onClick={() => {
                handleSignOut();
                setMenuOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-left text-gray-200 hover:bg-[#2a2d34] transition"
            >
              <LogOut size={16} className="mr-2 text-[#9b59b6]" /> Sign Out
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );

  // ======================================================
  // UI
  // ======================================================
  return (
    <>
      {/* Portal HUD — cannot be trapped by layout */}
      {createPortal(hud, document.body)}

      <div className="space-y-8 p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6 mt-4"
        >
          <h1
            className="font-orbitron text-3xl md:text-4xl text-white mb-2 tracking-wide"
            style={{
              background: "linear-gradient(to right, #3aa0ff, #9b59b6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 12px rgba(58,160,255,0.6)",
            }}
          >
            AIBBRY’s Task Tracker
          </h1>
          <p className="text-gray-400 italic text-sm">
            Shared list synced via Supabase ☁️
          </p>
        </motion.div>

        {/* Add Task Section */}
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
            <PlusCircle size={18} /> ADD
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

        {/* Task List */}
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
                    Added by: <span className="text-[#3aa0ff]">{task.added_by}</span>{" "}
                    {task.last_updated_by && (
                      <>
                        • Updated by:{" "}
                        <span className="text-[#9b59b6]">{task.last_updated_by}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => toggleTask(task)} className="hover:scale-110 transition">
                    <CheckCircle
                      size={20}
                      className={task.done ? "text-[#44ff9a]" : "text-gray-400"}
                    />
                  </button>
                  <button onClick={() => deleteTask(task)} className="hover:scale-110 transition">
                    <Trash2 size={20} className="text-[#ff6b6b]" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Toast */}
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
    </>
  );
}
