"use client";

import { Sun, Moon, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface StatusBarProps {
  onOpenSettings?: () => void;
}

export default function StatusBar({ onOpenSettings }: StatusBarProps) {
  const [isDark, setIsDark] = useState(false);

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
      } catch (_) { }
    } else {
      html.classList.add("dark");
      setIsDark(true);
      try {
        localStorage.setItem("kinetic_theme_v2", "dark");
      } catch (_) { }
    }
  };

  return (
    <div className="pt-[max(0.95rem,env(safe-area-inset-top,0px))] pb-3 sm:pb-3.5 px-4 sm:px-6 flex items-center justify-between border-b border-zinc-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md z-20 transition-colors">
      {/* Top Left: KINETIC Logo & Branding */}
      <div className="flex items-center gap-2.5 select-none">
        <img
          src="/icon-512.jpg"
          alt="KINETIC Logo"
          className="w-7 h-7 rounded-lg object-cover border border-[#FF4F00]/40 shadow-xs"
        />
        <span className="text-sm sm:text-[15px] font-mono font-black tracking-[0.24em] text-[#FF4F00]">
          KINETIC
        </span>
      </div>

      {/* Top Right: Actions (Theme Toggle & Settings) */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark / Light Mode"
          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all active:scale-95"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-zinc-700" />}
        </button>
        <button
          onClick={onOpenSettings}
          aria-label="App Settings & Data Reset"
          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-[#FF4F00] dark:hover:text-[#FF4F00] transition-all active:scale-95"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
