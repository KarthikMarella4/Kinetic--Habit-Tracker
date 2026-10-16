"use client";

import { useHabits } from "./HabitsProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DayStrip() {
  const {
    weekDays,
    selectedDayIso,
    setSelectedDayIso,
    getDayCompletionPercent,
    habits,
    goToPreviousWeek,
    goToNextWeek,
    jumpToToday,
    isCurrentWeek,
  } = useHabits();

  return (
    <section className="px-3.5 sm:px-6 py-1.5 sm:py-2">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPreviousWeek}
            title="Previous Week"
            aria-label="Previous Week"
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-bold">
            {weekDays[0].month} {weekDays[0].dateNum} — {weekDays[6].month} {weekDays[6].dateNum}
          </span>
          <button
            type="button"
            onClick={goToNextWeek}
            title="Next Week"
            aria-label="Next Week"
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={jumpToToday}
          className="text-[10px] font-mono font-bold text-[#FF4F00] uppercase tracking-wider hover:underline"
        >
          {isCurrentWeek ? "TODAY" : "JUMP TO TODAY"}
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 select-none">
        {weekDays.map((day) => {
          const isSelected = day.iso === selectedDayIso;
          const pct = getDayCompletionPercent(day.iso);
          const isComplete = pct === 100 && habits.length > 0;

          let dotColor = "bg-zinc-300 dark:bg-zinc-600";
          if (isComplete) dotColor = "bg-[#00D68F]";
          else if (pct > 0) dotColor = "bg-[#FF4F00]";

          return (
            <button
              key={day.iso}
              type="button"
              onClick={() => setSelectedDayIso(day.iso)}
              className={`flex flex-col items-center justify-between py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-xl sm:rounded-2xl border transition-all ${
                isSelected
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-md dark:bg-white dark:text-zinc-950 dark:border-white dark:shadow-xl scale-[1.02]"
                  : "bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200/90 shadow-xs dark:bg-[#1c1d21]/80 dark:hover:bg-[#1c1d21] dark:text-zinc-300 dark:border-zinc-800/80"
              }`}
            >
              <span
                className={`text-[8.5px] sm:text-[9px] font-mono tracking-wider uppercase font-bold ${
                  isSelected ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {day.shortDay}
              </span>
              <span
                className={`text-xs sm:text-sm font-black font-mono my-0.5 sm:my-1 ${
                  isSelected ? "text-white dark:text-zinc-950" : "text-zinc-900 dark:text-white"
                }`}
              >
                {day.dateNum}
              </span>
              <div className="flex items-center gap-0.5 h-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#FF4F00]" : dotColor}`} />
                {day.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F00]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
