"use client";

import { useHabits } from "./HabitsProvider";

interface BottomNavProps {
  onOpenModal?: () => void;
}

export default function BottomNav({ onOpenModal }: BottomNavProps) {
  const { activeTab, setActiveTab } = useHabits();

  return (
    <nav className="w-full bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border-t border-zinc-200/90 dark:border-zinc-800/80 rounded-none sm:rounded-b-[42px] px-3 sm:px-6 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pb-4 flex items-center justify-around select-none shadow-[0_-4px_20px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors">
      {/* TODAY Tab */}
      <button
        onClick={() => setActiveTab("dashboard")}
        className={`flex flex-col items-center gap-1 py-0.5 px-4 transition-all duration-150 active:scale-95 ${
          activeTab === "dashboard"
            ? "text-[#FF4F00]"
            : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200"
        }`}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] font-extrabold leading-none">
          TODAY
        </span>
      </button>

      {/* STREAKS Tab */}
      <button
        onClick={() => setActiveTab("analytics")}
        className={`flex flex-col items-center gap-1 py-0.5 px-4 transition-all duration-150 active:scale-95 ${
          activeTab === "analytics"
            ? "text-[#FF4F00]"
            : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200"
        }`}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <line x1="6" y1="20" x2="6" y2="13" />
          <line x1="12" y1="20" x2="12" y2="6" />
          <line x1="18" y1="20" x2="18" y2="11" />
        </svg>
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] font-extrabold leading-none">
          STREAKS
        </span>
      </button>

      {/* MANAGE Tab */}
      <button
        onClick={() => setActiveTab("manage")}
        className={`flex flex-col items-center gap-1 py-0.5 px-4 transition-all duration-150 active:scale-95 ${
          activeTab === "manage"
            ? "text-[#FF4F00]"
            : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200"
        }`}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] font-extrabold leading-none">
          MANAGE
        </span>
      </button>
    </nav>
  );
}
