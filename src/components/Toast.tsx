"use client";

import { useHabits } from "./HabitsProvider";

export default function Toast() {
  const { toast } = useHabits();

  return (
    <div
      className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${
        toast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2.5"
      }`}
    >
      <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-full shadow-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 border border-zinc-700 dark:border-zinc-200">
        <span className="w-2 h-2 rounded-full bg-[#FF4F00]" />
        <span>{toast || ""}</span>
      </div>
    </div>
  );
}
