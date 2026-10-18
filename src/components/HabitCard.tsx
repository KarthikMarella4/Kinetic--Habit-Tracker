"use client";

import { useHabits } from "./HabitsProvider";
import { Habit } from "@/lib/types";
import { playCompletionChime, triggerHaptic, unlockAudio } from "@/lib/sound";
import {
  Check,
  Circle,
  MoreHorizontal,
  Zap,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

interface HabitCardProps {
  habit: Habit;
  onEdit: (id: string) => void;
}

// Parses duration from habit configuration or habit name (e.g. "45m Core Architecture")
export function parseHabitDuration(habit: { name: string; timerMinutes?: number }): number | null {
  if (habit.timerMinutes && habit.timerMinutes > 0) {
    return habit.timerMinutes;
  }
  // Check "45m", "45 min", "45 mins", "45 minutes"
  const mMatch = habit.name.match(/(?:^|\s|\()(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes)\b/i);
  if (mMatch) {
    const val = parseFloat(mMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val);
  }
  // Check "1h", "2h", "1.5h"
  const hMatch = habit.name.match(/(?:^|\s|\()(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours)\b/i);
  if (hMatch) {
    const val = parseFloat(hMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 60);
  }
  // Explicit pattern matching for demo habits
  if (/Core Architecture/i.test(habit.name)) return 45;
  if (/Pomodoro/i.test(habit.name)) return 25;
  return null;
}

function formatCountdown(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function HabitCard({ habit, onEdit }: HabitCardProps) {
  const {
    selectedDayIso,
    getLogValue,
    incrementHabit,
    decrementHabit,
    calculateHabitStreak,
    showToast,
  } = useHabits();

  const [animating, setAnimating] = useState(false);
  const [completedCelebration, setCompletedCelebration] = useState(false);

  const currentVal = getLogValue(habit, selectedDayIso);
  const isDone = currentVal >= habit.target;
  const pct = Math.min(100, Math.round((currentVal / habit.target) * 100));
  const streak = calculateHabitStreak(habit);

  // Focus Timer / Stopwatch Configuration
  const detectedMinutes = parseHabitDuration(habit);
  const isDurationHabit = detectedMinutes !== null;
  // Collapsed by default as a dropdown in daily protocols
  const [showTimer, setShowTimer] = useState(false);

  const initialDurationMinutes = detectedMinutes ?? 25;
  const initialSeconds = initialDurationMinutes * 60;

  const [totalTimerSeconds, setTotalTimerSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  // Mobile background & throttling resilient timestamp ref
  const targetEndTimeRef = useRef<number | null>(null);

  // Update timer duration if habit config changes and timer is idle
  useEffect(() => {
    if (!isRunning) {
      const minutes = parseHabitDuration(habit) ?? 25;
      const secs = minutes * 60;
      setTotalTimerSeconds(secs);
      setRemainingSeconds(secs);
    }
  }, [habit.name, habit.timerMinutes, isRunning]);

  const handleIncrement = async () => {
    setAnimating(true);
    await incrementHabit(habit.id);
    setTimeout(() => setAnimating(false), 300);
  };

  // Completion trigger when countdown reaches 00:00
  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setRemainingSeconds(0);
    setCompletedCelebration(true);

    // Audio chime + Haptic feedback
    playCompletionChime();
    triggerHaptic();

    // Automatically check off the goal
    await incrementHabit(habit.id);
    showToast(`🎉 Focus Complete! "${habit.name}" checked off! 🔥`);

    // Reset celebration state and restore timer after 4 seconds
    setTimeout(() => {
      setCompletedCelebration(false);
      setRemainingSeconds(totalTimerSeconds);
    }, 4000);
  }, [habit.id, habit.name, incrementHabit, showToast, totalTimerSeconds]);

  // High-frequency tick loop with timestamp diff to prevent drift / background freeze
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (!targetEndTimeRef.current) return;
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        handleTimerComplete();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, handleTimerComplete]);

  // Stopwatch Controls
  const togglePlayPause = () => {
    unlockAudio();
    if (isRunning) {
      setIsRunning(false);
      targetEndTimeRef.current = null;
    } else {
      // If at 00:00 or completed, restart from full duration
      const startingSec = remainingSeconds <= 0 ? totalTimerSeconds : remainingSeconds;
      setRemainingSeconds(startingSec);
      targetEndTimeRef.current = Date.now() + startingSec * 1000;
      setIsRunning(true);
      setShowTimer(true);
      setCompletedCelebration(false);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setRemainingSeconds(totalTimerSeconds);
    setCompletedCelebration(false);
  };

  const handleFastFinish = () => {
    unlockAudio();
    handleTimerComplete();
  };

  // Elapsed timer progress
  const timerElapsedSec = Math.max(0, totalTimerSeconds - remainingSeconds);
  const timerPct = Math.min(100, Math.round((timerElapsedSec / totalTimerSeconds) * 100));

  return (
    <div
      className={`group relative rounded-2xl border p-4 transition-all ${
        animating || completedCelebration ? "animate-pop" : ""
      } ${
        completedCelebration
          ? "bg-emerald-500/10 border-emerald-500 dark:border-emerald-400 shadow-lg shadow-emerald-500/20"
          : isDone
          ? "bg-zinc-100/90 dark:bg-zinc-950/90 border-emerald-500/40 dark:border-emerald-500/40"
          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Check / Increment Action */}
        <button
          onClick={handleIncrement}
          aria-label="Log progress"
          className={`mt-0.5 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            isDone || completedCelebration
              ? "bg-[#00D68F] text-white shadow-lg shadow-[#00D68F]/35 scale-100"
              : "border-2 border-zinc-300 dark:border-zinc-700 hover:border-[#FF4F00] text-zinc-700 dark:text-zinc-200 bg-white/50 dark:bg-zinc-900/50"
          }`}
        >
          {isDone || completedCelebration ? (
            <Check className="w-6 h-6 stroke-[3.5]" />
          ) : habit.target > 1 ? (
            <span className="text-xs font-mono font-extrabold">+1</span>
          ) : (
            <Circle className="w-4 h-4 opacity-30" />
          )}
        </button>

        {/* Center Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${habit.color}18`,
                color: habit.color,
              }}
            >
              {habit.category}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-0.5">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              {streak}d streak
            </span>

            {/* Dropdown Toggle Badge */}
            {(isDurationHabit || showTimer) && (
              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  setShowTimer((prev) => !prev);
                }}
                aria-expanded={showTimer}
                className={`text-[9.5px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 font-bold transition-all cursor-pointer ${
                  showTimer
                    ? "bg-[#FF4F00] text-white shadow-xs"
                    : isRunning
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60"
                }`}
                title={showTimer ? "Click to hide stopwatch" : "Click to drop down stopwatch"}
              >
                <span>
                  {isRunning
                    ? formatCountdown(remainingSeconds)
                    : isDurationHabit
                    ? `${detectedMinutes}m Stopwatch`
                    : "Stopwatch"}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    showTimer ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>

          <h3
            className={`text-sm font-bold mt-1.5 leading-snug break-words ${
              isDone ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-white"
            }`}
          >
            {habit.name}
          </h3>

          {/* Progress Bar */}
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isDone ? "#10B981" : habit.color,
                }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 shrink-0">
              {currentVal}/{habit.target} {habit.unit}
            </span>
          </div>

          {/* Mini Countdown Stopwatch Inside Card */}
          {showTimer && (
            <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 animate-pop">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Time Display & Pulsing Status */}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all ${
                      isRunning
                        ? "bg-emerald-500/10 border-emerald-500/40"
                        : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isRunning
                          ? "bg-emerald-500 animate-ping"
                          : isDone
                          ? "bg-emerald-500"
                          : "bg-zinc-400 dark:bg-zinc-600"
                      }`}
                    />
                    <span className="text-sm font-mono font-black tracking-wider text-zinc-900 dark:text-zinc-100">
                      {formatCountdown(remainingSeconds)}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
                    {isRunning ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <span className="inline-block animate-pulse">●</span> FOCUSING
                      </span>
                    ) : isDone ? (
                      <span className="text-emerald-500">GOAL DONE ✓</span>
                    ) : (
                      `${Math.round(totalTimerSeconds / 60)}M STOPWATCH`
                    )}
                  </span>
                </div>

                {/* Stopwatch Action Controls */}
                <div className="flex items-center gap-1.5">
                  {/* Play / Pause Toggle */}
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                      isRunning
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : isDone
                        ? "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        : "bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900"
                    }`}
                    title={isRunning ? "Pause focus timer" : "Start countdown stopwatch"}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {remainingSeconds < totalTimerSeconds && remainingSeconds > 0
                            ? "Resume"
                            : "Start"}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={resetTimer}
                    className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Reset countdown"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Fast-Finish / Test Button */}
                  <button
                    type="button"
                    onClick={handleFastFinish}
                    className="p-1.5 rounded-xl bg-zinc-100 hover:bg-emerald-100 dark:bg-zinc-800 dark:hover:bg-emerald-950/60 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    title="Instant finish & auto-check goal"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>

              {/* Progress Track for Active Session */}
              <div className="mt-2 h-1 w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${timerPct}%`,
                    backgroundColor: isDone ? "#10B981" : habit.color,
                  }}
                />
              </div>

              {/* Status readout & hint */}
              <div className="mt-1 flex items-center justify-between text-[9.5px] font-mono text-zinc-400">
                <span>
                  {isRunning
                    ? "Auto-checks goal on 00:00"
                    : isDone
                    ? "Goal checked off automatically ✓"
                    : "Auto-checks goal on 00:00"}
                </span>
                <span>{timerPct}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={() => onEdit(habit.id)}
            title="Edit Goal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {currentVal > 0 && (
            <button
              onClick={() => decrementHabit(habit.id)}
              title="Undo step"
              className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-rose-500 transition-colors"
            >
              -1
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
