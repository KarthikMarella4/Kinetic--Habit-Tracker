"use client";

import { useState, useEffect } from "react";
import { useHabits } from "./HabitsProvider";
import { X } from "lucide-react";

interface HabitModalProps {
  isOpen: boolean;
  editHabitId: string | null;
  onClose: () => void;
}

export default function HabitModal({ isOpen, editHabitId, onClose }: HabitModalProps) {
  const { habits, createHabit, updateHabit, deleteHabit } = useHabits();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Deep Work");
  const [color, setColor] = useState("#FF4F00");
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState("session");

  useEffect(() => {
    if (editHabitId) {
      const h = habits.find((x) => x.id === editHabitId);
      if (h) {
        setName(h.name);
        setCategory(h.category);
        setColor(h.color);
        setTarget(h.target);
        setUnit(h.unit);
      }
    } else {
      setName("");
      setCategory("Deep Work");
      setColor("#FF4F00");
      setTarget(1);
      setUnit("session");
    }
  }, [editHabitId, habits, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = { name: name.trim(), category, color, target: Math.max(1, target), unit: unit || "unit" };

    if (editHabitId) {
      await updateHabit(editHabitId, data);
    } else {
      await createHabit(data);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!editHabitId) return;
    await deleteHabit(editHabitId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[440px] bg-stone-50 dark:bg-zinc-900 border-t sm:border border-zinc-300 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-pop max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
        {/* iOS Drag Handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF4F00] font-bold">
              PROTOCOL CONFIG
            </span>
            <h3 className="text-lg font-extrabold tracking-tight">
              {editHabitId ? "Edit Habit Protocol" : "Create Daily Habit"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">
              Habit Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 45m System Design Study"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:border-[#FF4F00]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:border-[#FF4F00]"
              >
                <option value="Deep Work">Deep Work</option>
                <option value="Fitness">Fitness</option>
                <option value="Learning">Learning</option>
                <option value="Wellness">Wellness</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">
                Accent Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:border-[#FF4F00]"
              >
                <option value="#FF4F00">Swiss Orange</option>
                <option value="#10B981">Emerald Green</option>
                <option value="#2563EB">Cobalt Blue</option>
                <option value="#7C3AED">Electric Violet</option>
                <option value="#F59E0B">Signal Amber</option>
                <option value="#F43F5E">Crimson Rose</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">
                Daily Target Steps
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value) || 1)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-mono font-bold focus:outline-none focus:border-[#FF4F00]"
              />
              <span className="text-[10px] text-zinc-400 font-mono">1 = Simple check-off</span>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">
                Unit Label
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., glasses, pages"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:border-[#FF4F00]"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center gap-2">
            {editHabitId && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-mono text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Save Habit Protocol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
