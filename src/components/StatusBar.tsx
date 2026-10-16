"use client";

import { useHabits } from "./HabitsProvider";
import { Sun, Moon, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface StatusBarProps {
  onOpenSettings?: () => void;
}

export default function StatusBar({ onOpenSettings }: StatusBarProps) {
  const { weekDays, selectedDayIso, todayObj } = useHabits();
  const [isDark, setIsDark] = useState(false);

  const activeDay = weekDays.find((d) => d.iso === selectedDayIso) || todayObj;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kinetic_theme_v2");
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      } else {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
      }
    } catch (_) {
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setIsDark(false);
      try {
        localStorage.setItem("kinetic_theme_v2", "light");
      } catch (_) {}
    } else {
      html.classList.add("dark");
      setIsDark(true);
      try {
        localStorage.setItem("kinetic_theme_v2", "dark");
      } catch (_) {}
    }
  };

  return (
    <div className="pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-2 px-3.5 sm:px-5 flex items-center justify-between border-b border-zinc-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md z-20 transition-colors">
      {/* Top Left: Date */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-mono font-bold tracking-wider text-zinc-800 dark:text-zinc-100 uppercase">
          {activeDay.shortDay} {activeDay.dateNum} {activeDay.month}
        </span>
      </div>

      {/* Top Middle: KINETIC Logo */}
      <div className="flex items-center gap-2 select-none">
        <img
          src="/icon-512.jpg"
          alt="KINETIC Logo"
          className="w-5 h-5 rounded-md object-cover border border-[#FF4F00]/40 shadow-xs"
        />
        <span className="text-xs font-mono font-extrabold tracking-[0.22em] text-[#FF4F00]">
          KINETIC
        </span>
      </div>

      {/* Top Right: Actions (Theme Toggle & Settings) */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark / Light Mode"
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
        </button>
        <button
          onClick={onOpenSettings}
          aria-label="App Settings & Data Reset"
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-[#FF4F00] dark:hover:text-[#FF4F00] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
