"use client";

import { useHabits } from "./HabitsProvider";
import HabitCard from "./HabitCard";
import { Plus } from "lucide-react";

interface HabitsListProps {
  onOpenModal: (habitId?: string) => void;
}

export default function HabitsList({ onOpenModal }: HabitsListProps) {
  const { habits, selectedCategory, setSelectedCategory, selectedDayIso, weekDays, todayObj } =
    useHabits();

  const activeDay = weekDays.find((d) => d.iso === selectedDayIso) || todayObj;

  const categories = ["ALL", "DEEP WORK", "FITNESS", "LEARNING", "WELLNESS"];
  const filtered =
    selectedCategory === "ALL" || selectedCategory === "All"
      ? habits
      : habits.filter((h) => h.category.toUpperCase() === selectedCategory.toUpperCase());

  return (
    <section className="px-3.5 sm:px-6">
      {/* Header: DAILY PROTOCOL & + NEW GOAL */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold tracking-tight uppercase text-zinc-900 dark:text-white">DAILY PROTOCOL</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-[#1c1d21] border border-zinc-300/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold uppercase">
            {activeDay.isToday ? "TODAY" : `${activeDay.shortDay} ${activeDay.dateNum}`}
          </span>
        </div>
        <button
          onClick={() => onOpenModal()}
          className="text-xs font-mono font-bold text-[#FF4F00] flex items-center gap-1 hover:opacity-80 active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>NEW GOAL</span>
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2.5 -mx-1 px-1">
        {categories.map((cat) => {
          const active =
            selectedCategory.toUpperCase() === cat ||
            (cat === "ALL" && selectedCategory === "All");
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat === "ALL" ? "All" : cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider shrink-0 transition-all font-bold ${
                active
                  ? "bg-[#FF4F00] text-white shadow-xs"
                  : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200/90 shadow-xs dark:bg-[#1c1d21]/90 dark:text-zinc-400 dark:hover:text-white dark:border-zinc-800/80"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Habit Cards */}
      <div className="space-y-3 mt-1 pb-6">
        {filtered.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <p className="text-xs font-mono uppercase text-zinc-500 dark:text-zinc-400">
              {habits.length === 0 ? "No active habits • Start your first streak" : "No habits in this category"}
            </p>
            <button
              onClick={() => onOpenModal()}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#FF4F00] text-white text-xs font-mono font-bold uppercase hover:opacity-90 transition-opacity"
            >
              + Add Protocol
            </button>
          </div>
        ) : (
          filtered.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onEdit={(id) => onOpenModal(id)} />
          ))
        )}
      </div>
    </section>
  );
}
