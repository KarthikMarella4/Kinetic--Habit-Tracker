"use client";

import { useHabits } from "./HabitsProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

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

  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef<number | null>(null);
  const wheelCooldownRef = useRef(false);

  const triggerPrevious = () => {
    setSlideDirection("right");
    goToPreviousWeek();
    setTimeout(() => setSlideDirection(null), 250);
  };

  const triggerNext = () => {
    setSlideDirection("left");
    goToNextWeek();
    setTimeout(() => setSlideDirection(null), 250);
  };

  // Touch Swipe Handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Trigger only if horizontal swipe dominates vertical movement
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
      if (deltaX > 0) {
        triggerPrevious();
      } else {
        triggerNext();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Wheel / Trackpad Scroll Handlers
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelCooldownRef.current) return;
    const delta = Math.abs(e.deltaX) > 15 ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (Math.abs(delta) > 20) {
      wheelCooldownRef.current = true;
      if (delta > 0) {
        triggerNext();
      } else {
        triggerPrevious();
      }
      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 350);
    }
  };

  // Mouse Drag Handlers (Desktop click & drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || dragStartXRef.current === null) return;
    const deltaX = e.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        triggerPrevious();
      } else {
        triggerNext();
      }
    }
    isDraggingRef.current = false;
    dragStartXRef.current = null;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    dragStartXRef.current = null;
  };

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="px-3.5 sm:px-6 py-1.5 sm:py-2 touch-pan-y"
    >
      <div className="flex items-center justify-between mb-2 px-0.5 select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={triggerPrevious}
            title="Previous Week"
            aria-label="Previous Week"
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            title="Swipe or scroll left/right to move week"
            className="flex items-center gap-1 cursor-grab active:cursor-grabbing select-none px-1.5 py-0.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-bold">
              {weekDays[0].month} {weekDays[0].dateNum} — {weekDays[6].month} {weekDays[6].dateNum}
            </span>
          </div>

          <button
            type="button"
            onClick={triggerNext}
            title="Next Week"
            aria-label="Next Week"
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 active:scale-95 transition-all"
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

      <div
        className={`grid grid-cols-7 gap-1 sm:gap-1.5 select-none transition-transform duration-200 ${
          slideDirection === "left"
            ? "-translate-x-1"
            : slideDirection === "right"
            ? "translate-x-1"
            : "translate-x-0"
        }`}
      >
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
