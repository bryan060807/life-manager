// ======================================================
//  src/components/MainTaskTracker.tsx  (FULL OPTIMISED)
//  AIBBRY’s Shared Task Tracker — Full Realtime Sync
// ======================================================
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import supabase from "../lib/supabaseClient";
import { toast } from "../lib/toast";

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
  const [syncing, setSyncing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [openSections, setOpenSections] = useState({ daily: true, weekly: false, buy: false });

  /* ----------  FETCH  ---------- */
  const fetchTasks = useCallback(async () => {
    setSyncing(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("last_modified", { ascending: false });

    if (error) {
      toast("❌ Fetch failed", error.message);
      console.error(error);
    } else {
      setTasks(data || []);
      setLastSynced(new Date());
    }
    setSyncing(false);
  }, []);

  /* ----------  REALTIME  (defer until mount)  ---------- */
  useEffect(() => {
    fetchTasks(); // initial
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasks())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  /* ----------  CRUD  ---------- */
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
    if (error) return toast("❌ Add failed", error.message);
    setInput("");
    toast("✅ Task added");
    fetchTasks();
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
      .eq("id", task.id);
    if (error) toast("❌ Toggle failed", error.message);
    setSyncing(false);
    fetchTasks();
  };

  const deleteTask = async (task: Task) => {
    setSyncing(true);
    const { error } = await supabase
      .from("tasks")
      .update({ deleted: true, last_modified: new Date().toISOString() })
      .eq("id", task.id);
    if (error) toast("❌ Delete failed", error.message);
    else toast("🗑️ Task deleted");
    setSyncing(false);
  };

  const purgeDeleted = async () => {
    setSyncing(true);
    const { error } = await supabase.from("tasks").delete().eq("deleted", true);
    if (error) toast("❌ Purge failed", error.message);
    else toast("🧹 Deleted tasks purged");
    setSyncing(false);
  };

  const refreshSync = () => {
    toast("🔄 Refreshing sync...");
    fetchTasks();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut?.();
  };

  /* ----------  DERIVED  ---------- */
  const filtered = {
    daily: tasks.filter((t) => t.type === "daily" && !t.deleted),
    weekly: tasks.filter((t) => t.type === "weekly" && !t.deleted),
    buy: tasks.filter((t) => t.type === "buy" && !t.deleted),
  };

  /* ----------  RENDER  ---------- */
  return (
    <div className="space-y-8 p-4 relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-6 relative"
      >
        <h1 className="font-orbitron text-3xl md:text-4xl title-gradient">AIBBRY’s Shared Task Tracker</h1>
        <p className="text-gray-400 italic text-sm">Shared workspace — synced in real-time ☁️</p>

        <div className="absolute top-2 right-4">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="p-2 rounded-full bg-[#1e2229] text-white hover:bg-[#2b2f37] shadow-md transition"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute right-0 mt-2 bg-[#1c1e24] border border-gray-700 rounded-lg shadow-lg py-2 w-48 z-20"
            >
              <button
                onClick={() => {
                  purgeDeleted();
                  setMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-left text-gray-200 hover:bg-[#2a2d34] transition"
              >
                <XCircle size={16} className="mr-2 text-[#ff6b6b]" />
                Purge Deleted
              </button>

              <button
                onClick={() => {
                  refreshSync();
                  setMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-left text-gray-200 hover:bg-[#2a2d34] transition"
              >
                <RefreshCcw size={16} className="mr-2 text-[#3aa0ff]" />
                Refresh Sync
              </button>

              <button
                onClick={() => {
                  handleSignOut();
                  setMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-left text-gray-200 hover:bg-[#2a2d34] transition"
              >
                <LogOut size={16} className="mr-2 text-[#9b59b6]" />
                Sign Out
              </button>

              <div className="border-t border-gray-700 my-1" />

              <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
                <Clock size={14} className="text-[#44ff9a]" />
                Last Synced:{" "}
                <span className="text-gray-200">
                  {lastSynced ? lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Never"}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Input */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add task..."
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
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="buy">Buy</option>
        </select>
        <button onClick={addTask} className="neon-button flex items-center gap-2">
          <PlusCircle size={18} /> Add
        </button>
      </div>

      {/* Sections */}
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { label: "Daily Tasks", type: "daily", color: "#3aa0ff" },
          { label: "Weekly Goals", type: "weekly", color: "#9b59b6" },
          { label: "Things to Buy", type: "buy", color: "#44ff9a" },
        ].map((section) => (
          <div key={section.type}>
            <button
              className="w-full flex justify-between items-center mb-3 md:cursor-default md:mb-4"
              onClick={() => setOpenSections((p) => ({ ...p, [section.type]: !p[section.type as keyof typeof openSections] }))}
            >
              <h3 className="font-orbitron text-lg" style={{ color: section.color, textShadow: `0 0 10px ${section.color}66` }}>
                {section.label}
              </h3>
              <span className="md:hidden">
                {openSections[section.type as keyof typeof openSections] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>

            <AnimatePresence>
              {(openSections[section.type as keyof typeof openSections] || window.innerWidth >= 768) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  {/*  Plain map (typed)  */}
                  {filtered[section.type as keyof typeof filtered].map((task: Task) => (
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
                          Added by: <span className="text-[#3aa0ff]">{task.added_by}</span>
                          {task.last_updated_by && (
                            <> • Updated by: <span className="text-[#9b59b6]">{task.last_updated_by}</span></>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => toggleTask(task)} className="hover:scale-110 transition-transform">
                          <CheckCircle size={20} className={task.done ? "text-[#44ff9a]" : "text-gray-400"} />
                        </button>
                        <button onClick={() => deleteTask(task)} className="hover:scale-110 transition-transform">
                          <Trash2 size={20} className="text-[#ff6b6b]" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Sync HUD */}
      {syncing && (
        <div className="fixed bottom-6 left-6 bg-[#1e1f26dd] text-white p-3 rounded-lg border border-[#44ff9a55] font-orbitron text-sm backdrop-blur-md shadow-lg flex items-center gap-2">
          <Wifi size={16} className="text-[#44ff9a]" /> Syncing...
        </div>
      )}
    </div>
  );
}