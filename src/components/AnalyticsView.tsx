"use client";

import { useHabits } from "./HabitsProvider";

export default function AnalyticsView() {
  const {
    habits,
    weekDays,
    getDayCompletedCount,
    getLogValue,
    calculateHabitStreak,
    toggleMatrixCell,
  } = useHabits();

  // Weekly metrics
  const totalPossible = habits.length * 7;
  let totalCompleted = 0;
  let perfectDays = 0;
  weekDays.forEach((d) => {
    const dayDone = getDayCompletedCount(d.iso);
    totalCompleted += dayDone;
    if (habits.length > 0 && dayDone === habits.length) perfectDays++;
  });
  const weeklyRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  const maxStreak = habits.reduce((max, h) => Math.max(max, calculateHabitStreak(h)), 0);

  // Category breakdown
  const categories = ["Deep Work", "Fitness", "Learning", "Wellness"];

  return (
    <div className="space-y-5 pt-3 px-4 sm:px-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 sm:p-3.5 shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block truncate">STREAK</span>
          <span className="text-lg sm:text-2xl font-extrabold font-mono mt-0.5 sm:mt-1 block text-[#FF4F00]">{maxStreak}D</span>
          <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500 block truncate">Best Streak</span>
        </div>
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 sm:p-3.5 shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block truncate">WEEK RATE</span>
          <span className="text-lg sm:text-2xl font-extrabold font-mono mt-0.5 sm:mt-1 block text-zinc-900 dark:text-zinc-50">{weeklyRate}%</span>
          <span className="text-[9px] sm:text-[10px] font-mono text-emerald-600 dark:text-emerald-500 block truncate">
            {totalCompleted}/{totalPossible} Logs
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 sm:p-3.5 shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block truncate">PERFECT</span>
          <span className="text-lg sm:text-2xl font-extrabold font-mono mt-0.5 sm:mt-1 block text-zinc-900 dark:text-zinc-50">{perfectDays}/7</span>
          <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500 block truncate">Days 100%</span>
        </div>
      </div>

      {/* 7-Day Habit Matrix */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white">Consistency Matrix</h3>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              Tap cell to toggle status
            </p>
          </div>
          <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
            {weekDays[0].month} {weekDays[0].dateNum} — {weekDays[6].month} {weekDays[6].dateNum}
          </span>
        </div>

        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="min-w-[300px] space-y-2.5">
            {/* Header row */}
            <div className="grid grid-cols-12 items-center gap-1 pb-1.5 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-bold">
              <div className="col-span-5 uppercase truncate">Habit</div>
            <div className="col-span-7 grid grid-cols-7 gap-1 text-center">
              {weekDays.map((d) => (
                <span key={d.iso} className={d.isToday ? "text-[#FF4F00]" : ""}>
                  {d.shortDay[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Habit rows */}
          {habits.map((h) => (
            <div
              key={h.id}
              className="grid grid-cols-12 items-center gap-1 py-1.5 border-b border-zinc-200/70 dark:border-zinc-800/50 last:border-none"
            >
              <div className="col-span-5 pr-2">
                <p className="text-xs font-semibold truncate text-zinc-900 dark:text-white">{h.name}</p>
                <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">{h.category}</span>
              </div>
              <div className="col-span-7 grid grid-cols-7 gap-1 items-center">
                {weekDays.map((d) => {
                  const val = getLogValue(h, d.iso);
                  const done = val >= h.target;
                  const partial = val > 0 && val < h.target;

                  let cellClass =
                    "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-transparent";
                  if (done) cellClass = "text-white border-transparent";
                  else if (partial)
                    cellClass = "border-[#FF4F00]/50 text-[#FF4F00] bg-[#FF4F00]/10";

                  return (
                    <button
                      key={d.iso}
                      onClick={() => toggleMatrixCell(h.id, d.iso)}
                      title={`${h.name} on ${d.shortDay}: ${val}/${h.target}`}
                      style={done ? { backgroundColor: h.color } : undefined}
                      className={`w-6 h-6 mx-auto rounded-md border flex items-center justify-center text-[10px] font-mono font-bold transition-transform active:scale-90 ${cellClass}`}
                    >
                      {done ? "✓" : partial ? "•" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-tight mb-3 text-zinc-900 dark:text-white">Category Distribution</h3>
        <div className="space-y-3">
          {categories.map((cat) => {
            const catHabits = habits.filter((h) => h.category === cat);
            if (catHabits.length === 0) return null;

            let catDone = 0;
            const catTotal = catHabits.length * 7;
            catHabits.forEach((h) => {
              weekDays.forEach((d) => {
                if (getLogValue(h, d.iso) >= h.target) catDone++;
              });
            });
            const pct = Math.round((catDone / catTotal) * 100);
            const color = catHabits[0].color;

            return (
              <div key={cat}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="font-bold uppercase text-zinc-800 dark:text-zinc-200">{cat}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {catDone}/{catTotal} days ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
