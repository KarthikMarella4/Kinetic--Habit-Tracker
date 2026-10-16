"use client";

import { useHabits } from "./HabitsProvider";
import { Plus, ArrowUp, ArrowDown, Edit3, Trash2, Zap, Target, Layers } from "lucide-react";
import { useState } from "react";

interface ManageViewProps {
  onOpenModal: (habitId?: string) => void;
}

export default function ManageView({ onOpenModal }: ManageViewProps) {
  const { habits, moveHabitUp, moveHabitDown, deleteHabit, calculateHabitStreak } = useHabits();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalDailySteps = habits.reduce((acc, h) => acc + h.target, 0);
  const categories = Array.from(new Set(habits.map((h) => h.category)));

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      await deleteHabit(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId((curr) => (curr === id ? null : curr)), 3500);
    }
  };

  return (
    <div className="space-y-4 pt-1 px-3.5 sm:px-6">
      {/* Telemetry Overview Card */}
      <div className="bg-white dark:bg-[#0c0d0f] border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs dark:shadow-lg transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF4F00] font-bold">
              CONTROL HUB
            </span>
            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white mt-0.5">
              Goals Manager
            </h2>
          </div>
          <button
            onClick={() => onOpenModal()}
            className="px-3 py-1.5 rounded-xl bg-[#FF4F00] hover:bg-[#e04500] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/70">
          <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-[9px] font-mono uppercase text-zinc-400 block">Active Goals</span>
            <span className="text-xl font-black font-mono text-zinc-900 dark:text-white block mt-0.5">
              {habits.length}
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-[9px] font-mono uppercase text-zinc-400 block">Daily Workload</span>
            <span className="text-xl font-black font-mono text-zinc-900 dark:text-white block mt-0.5">
              {totalDailySteps} <span className="text-xs font-normal text-zinc-400">steps</span>
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-[9px] font-mono uppercase text-zinc-400 block">Categories</span>
            <span className="text-xl font-black font-mono text-zinc-900 dark:text-white block mt-0.5">
              {categories.length}
            </span>
          </div>
        </div>
      </div>

      {/* Protocol List with Priority Reordering */}
      <div className="space-y-2.5 pb-6">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">
            Active Priority Sequence
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            Use ▲ ▼ to adjust dashboard order
          </span>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50">
            <Layers className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-mono uppercase text-zinc-500 dark:text-zinc-400">
              No active goals registered
            </p>
            <button
              onClick={() => onOpenModal()}
              className="mt-3 px-4 py-2 rounded-xl bg-[#FF4F00] text-white text-xs font-mono font-bold uppercase hover:opacity-90 transition-opacity"
            >
              + Create First Goal
            </button>
          </div>
        ) : (
          habits.map((habit, index) => {
            const streak = calculateHabitStreak(habit);
            const isFirst = index === 0;
            const isLast = index === habits.length - 1;
            const isPendingDelete = deletingId === habit.id;

            return (
              <div
                key={habit.id}
                className="bg-white dark:bg-[#151619] border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl p-3.5 shadow-xs transition-all relative overflow-hidden"
              >
                {/* Left Accent Color Indicator */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: habit.color }}
                />

                <div className="flex items-center justify-between gap-3 pl-1.5">
                  {/* Order Index Pill */}
                  <span className="text-xs font-mono font-black text-zinc-300 dark:text-zinc-600 select-none">
                    #{String(index + 1).padStart(2, "0")}
                  </span>

                  {/* Habit Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${habit.color}15`,
                          color: habit.color,
                        }}
                      >
                        {habit.category}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-0.5">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {streak}d streak
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-1 truncate">
                      {habit.name}
                    </h3>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-zinc-400" />
                        {habit.target} {habit.unit}/day
                      </span>
                    </div>
                  </div>

                  {/* Actions: Reorder + Edit + Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Move Up */}
                    <button
                      onClick={() => moveHabitUp(habit.id)}
                      disabled={isFirst}
                      title="Move Up"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => moveHabitDown(habit.id)}
                      disabled={isLast}
                      title="Move Down"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onOpenModal(habit.id)}
                      title="Edit Habit"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-[#FF4F00] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(habit.id)}
                      title={isPendingDelete ? "Click again to confirm delete" : "Delete Habit"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isPendingDelete
                          ? "bg-rose-600 text-white animate-pulse"
                          : "text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isPendingDelete && (
                  <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-[11px] font-mono text-rose-600 dark:text-rose-400 px-1">
                    <span>Tap trash icon again to permanently delete</span>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-zinc-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
