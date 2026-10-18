"use client";

import { useHabits } from "./HabitsProvider";

export default function Toast() {
  const { toast } = useHabits();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 sm:top-5 inset-x-0 mx-auto z-[100] pointer-events-none transition-all duration-300 animate-pop w-fit max-w-[calc(100vw-2rem)] sm:max-w-md px-3 flex justify-center items-center"
    >
      <div className="bg-zinc-950/95 dark:bg-white/95 text-white dark:text-zinc-950 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.3)] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 border border-zinc-700/80 dark:border-zinc-200/90 text-center mx-auto transition-all">
        <span className="w-2 h-2 rounded-full bg-[#FF4F00] shrink-0 animate-pulse" />
        <span className="break-words text-center leading-tight max-w-[280px] sm:max-w-none">{toast}</span>
      </div>
    </div>
  );
}
