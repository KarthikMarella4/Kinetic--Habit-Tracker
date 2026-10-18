"use client";

import { useHabits } from "./HabitsProvider";

export default function Header() {
  const {
    habits,
    weekDays,
    todayObj,
    selectedDayIso,
    getDayCompletionPercent,
    getDayCompletedCount,
    calculateHabitStreak,
    userName,
    isFreezeActive,
  } = useHabits();

  const activeDay = weekDays.find((d) => d.iso === selectedDayIso) || todayObj;
  const pct = getDayCompletionPercent(selectedDayIso);
  const doneCount = getDayCompletedCount(selectedDayIso);
  const bestStreak =
    habits.length > 0 ? habits.reduce((acc, h) => Math.max(acc, calculateHabitStreak(h)), 0) : 0;

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <header className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2.5 sm:pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {/* Top Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FF4F00]/10 dark:bg-[#FF4F00]/15 text-[#FF4F00] border border-[#FF4F00]/25 dark:border-[#FF4F00]/30 rounded-md flex items-center gap-1.5 font-bold">
              <span className="text-xs leading-none">🔥</span>
              <span>{bestStreak}D STREAK</span>
            </span>

            {isFreezeActive && (
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30 rounded-md flex items-center gap-1">
                <span>❄️</span>
                <span>FROZEN</span>
              </span>
            )}
          </div>

          {/* User Name */}
          <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight mt-2 leading-none truncate text-zinc-900 dark:text-white">
            {userName}
          </h1>

          {/* Date Label */}
          <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-1.5 uppercase tracking-wider truncate">
            {activeDay.fullDay.toUpperCase()}, {activeDay.month} {activeDay.dateNum}{" "}
            {activeDay.isToday ? "• TODAY" : ""}
          </p>
        </div>

        {/* Daily Completion Ring */}
        <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
          <svg className="w-16 h-16" viewBox="0 0 64 64">
            <circle
              className="text-zinc-200 dark:text-zinc-800"
              strokeWidth="5"
              stroke="currentColor"
              fill="transparent"
              r="26"
              cx="32"
              cy="32"
            />
            <circle
              className="text-[#FF4F00] transition-all duration-500"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="26"
              cx="32"
              cy="32"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-mono font-bold leading-none text-zinc-900 dark:text-white">
              {pct}%
            </span>
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
              {doneCount}/{habits.length}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
