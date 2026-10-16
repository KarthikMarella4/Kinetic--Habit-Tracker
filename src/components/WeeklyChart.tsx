"use client";

import { useHabits } from "./HabitsProvider";

export default function WeeklyChart() {
  const { habits, weekDays, selectedDayIso, setSelectedDayIso, getDayCompletionPercent, setActiveTab } =
    useHabits();

  let totalWeekPct = 0;
  const dayData = weekDays.map((day) => {
    const pct = getDayCompletionPercent(day.iso);
    totalWeekPct += pct;
    return { ...day, pct };
  });
  const avg = habits.length > 0 ? Math.round(totalWeekPct / 7) : 0;

  return (
    <section className="px-3.5 sm:px-6">
      <div className="bg-white dark:bg-[#0c0d0f] border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-5 shadow-xs dark:shadow-lg transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-bold">
              WEEKLY VELOCITY
            </h2>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-zinc-900 dark:text-white">{avg}%</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                {habits.length > 0 ? "+14% vs last wk" : "0 habits logged"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("analytics")}
            className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-50 dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center gap-1.5 transition-colors"
          >
            <span>Matrix</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 7h10v10" /><path d="M7 17L17 7" />
            </svg>
          </button>
        </div>

        {/* 7-Day Interactive Bar Chart */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 items-end h-28 pt-4 pb-1 border-b border-zinc-200/90 dark:border-zinc-800/80">
          {dayData.map((day) => {
            const isSelected = day.iso === selectedDayIso;
            const isComplete = day.pct === 100 && habits.length > 0;
            const barHeight = habits.length > 0 ? (day.pct > 0 ? day.pct : 6) : 0;
            const barColor = isComplete ? "bg-[#00D68F]" : "bg-[#FF4F00]";

            return (
              <div
                key={day.iso}
                className="flex flex-col items-center justify-end h-full cursor-pointer group"
                onClick={() => setSelectedDayIso(day.iso)}
              >
                <span
                  className={`text-[10px] font-mono font-bold mb-1 transition-opacity ${
                    isSelected ? "text-[#FF4F00] opacity-100" : "text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {day.pct}%
                </span>
                <div className="w-full max-w-[28px] bg-zinc-100 dark:bg-[#18191d] rounded-sm h-20 flex items-end p-0.5 border border-zinc-200/80 dark:border-zinc-800/60">
                  <div
                    className={`w-full rounded-xs transition-all duration-500 ${barColor}`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Day Labels Mon-Sun */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2.5 text-center">
          {dayData.map((day) => {
            const isSelected = day.iso === selectedDayIso;
            return (
              <div
                key={day.iso}
                className={`text-[10px] font-mono font-bold uppercase ${
                  isSelected ? "text-[#FF4F00]" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {day.shortDay}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
