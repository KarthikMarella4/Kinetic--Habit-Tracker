"use client";

import { useHabits } from "./HabitsProvider";
import { Habit } from "@/lib/types";
import { Check, Circle, MoreHorizontal, Zap } from "lucide-react";
import { useState } from "react";

interface HabitCardProps {
  habit: Habit;
  onEdit: (id: string) => void;
}

export default function HabitCard({ habit, onEdit }: HabitCardProps) {
  const { selectedDayIso, getLogValue, incrementHabit, decrementHabit, calculateHabitStreak } =
    useHabits();
  const [animating, setAnimating] = useState(false);

  const currentVal = getLogValue(habit, selectedDayIso);
  const isDone = currentVal >= habit.target;
  const pct = Math.min(100, Math.round((currentVal / habit.target) * 100));
  const streak = calculateHabitStreak(habit);

  const handleIncrement = async () => {
    setAnimating(true);
    await incrementHabit(habit.id);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div
      className={`group relative rounded-2xl border p-4 transition-all ${
        animating ? "animate-pop" : ""
      } ${
        isDone
          ? "bg-zinc-100/90 dark:bg-zinc-950/90 border-emerald-500/40 dark:border-emerald-500/40"
          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Check / Increment Action */}
        <button
          onClick={handleIncrement}
          aria-label="Log progress"
          className={`mt-0.5 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            isDone
              ? "bg-[#00D68F] text-white shadow-lg shadow-[#00D68F]/35 scale-100"
              : "border-2 border-zinc-300 dark:border-zinc-700 hover:border-[#FF4F00] text-zinc-700 dark:text-zinc-200 bg-white/50 dark:bg-zinc-900/50"
          }`}
        >
          {isDone ? (
            <Check className="w-6 h-6 stroke-[3.5]" />
          ) : habit.target > 1 ? (
            <span className="text-xs font-mono font-extrabold">+1</span>
          ) : (
            <Circle className="w-4 h-4 opacity-30" />
          )}
        </button>

        {/* Center Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${habit.color}18`,
                color: habit.color,
              }}
            >
              {habit.category}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-0.5">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              {streak}d streak
            </span>
          </div>

          <h3
            className={`text-sm font-bold mt-1.5 leading-snug break-words ${
              isDone ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-white"
            }`}
          >
            {habit.name}
          </h3>

          {/* Progress Bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isDone ? "#10B981" : habit.color,
                }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 shrink-0">
              {currentVal}/{habit.target} {habit.unit}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={() => onEdit(habit.id)}
            title="Edit Habit"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {currentVal > 0 && (
            <button
              onClick={() => decrementHabit(habit.id)}
              title="Undo step"
              className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-rose-500 transition-colors"
            >
              -1
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
