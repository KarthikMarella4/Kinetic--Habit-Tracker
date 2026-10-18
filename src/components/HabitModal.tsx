"use client";

import { useState, useEffect } from "react";
import { useHabits } from "./HabitsProvider";
import { X, ChevronDown } from "lucide-react";
import { GoalScheduleType, HabitFormData } from "@/lib/types";

interface HabitModalProps {
  isOpen: boolean;
  editHabitId: string | null;
  onClose: () => void;
}

export default function HabitModal({ isOpen, editHabitId, onClose }: HabitModalProps) {
  const { habits, createHabit, updateHabit, deleteHabit, todayIso, tomorrowIso } = useHabits();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Deep Work");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [color, setColor] = useState("#FF4F00");
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState("");
  const [scheduleType, setScheduleType] = useState<GoalScheduleType>("daily");
  const [scheduledDate, setScheduledDate] = useState(tomorrowIso || "");
  const [startDate, setStartDate] = useState(todayIso || "");
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [isCustomTimer, setIsCustomTimer] = useState(false);
  const [customTimerValue, setCustomTimerValue] = useState("");

  // Helper to extract duration from title
  const extractDuration = (title: string): number | null => {
    const m = title.match(/(?:^|\s|\()(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes)\b/i);
    if (m) {
      const v = parseFloat(m[1]);
      if (!isNaN(v) && v > 0) return Math.round(v);
    }
    const h = title.match(/(?:^|\s|\()(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours)\b/i);
    if (h) {
      const v = parseFloat(h[1]);
      if (!isNaN(v) && v > 0) return Math.round(v * 60);
    }
    return null;
  };

  // Aggregate prebuilt + existing custom categories
  const existingCategories = Array.from(
    new Set([
      "Deep Work",
      "Fitness",
      "Learning",
      "Wellness",
      ...habits.map((h) => h.category),
    ])
  );

  useEffect(() => {
    if (editHabitId) {
      const h = habits.find((x) => x.id === editHabitId);
      if (h) {
        setName(h.name);
        setCategory(h.category);
        const isCustom = !["Deep Work", "Fitness", "Learning", "Wellness"].includes(h.category);
        setIsCustomCategory(isCustom);
        setCustomCategory(isCustom ? h.category : "");
        setColor(h.color);
        setTarget(h.target);
        setUnit(h.unit);
        setStartDate(h.startDate || todayIso);
        setScheduleType(h.scheduleType || (h.startDate === tomorrowIso ? "schedule" : "daily"));
        setScheduledDate(h.scheduledDate || h.startDate || tomorrowIso);
        if (h.timerMinutes && h.timerMinutes > 0) {
          setTimerMinutes(h.timerMinutes);
          setIsCustomTimer(![5, 10, 15, 20, 25, 30, 45, 60].includes(h.timerMinutes));
          setCustomTimerValue(String(h.timerMinutes));
        } else {
          setTimerMinutes(null);
          setIsCustomTimer(false);
          setCustomTimerValue("");
        }
      }
    } else {
      setName("");
      setCategory("Deep Work");
      setIsCustomCategory(false);
      setCustomCategory("");
      setColor("#FF4F00");
      setTarget(1);
      setUnit("");
      setStartDate(todayIso);
      setScheduleType("daily");
      setScheduledDate(tomorrowIso);
      setTimerMinutes(null);
      setIsCustomTimer(false);
      setCustomTimerValue("");
    }
  }, [editHabitId, habits, isOpen, todayIso, tomorrowIso]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editHabitId && !isCustomTimer) {
      const detected = extractDuration(val);
      if (detected) {
        setTimerMinutes(detected);
        if (![5, 10, 15, 20, 25, 30, 45, 60].includes(detected)) {
          setIsCustomTimer(true);
          setCustomTimerValue(String(detected));
        }
      }
    }
  };

  const isDuplicateName = habits.some(
    (h) =>
      h.id !== editHabitId &&
      h.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isDuplicateName) return;

    const finalCategory = isCustomCategory
      ? (customCategory.trim() || "General")
      : category;

    const activeTimer = isCustomTimer
      ? parseInt(customTimerValue, 10) || null
      : timerMinutes;

    const finalStartDate =
      scheduleType === "schedule"
        ? (scheduledDate || tomorrowIso)
        : todayIso;

    const finalScheduledDate =
      scheduleType === "schedule"
        ? (scheduledDate || tomorrowIso)
        : scheduleType === "today"
        ? todayIso
        : undefined;

    const data: HabitFormData = {
      name: name.trim(),
      category: finalCategory,
      color,
      target: Math.max(1, target),
      unit: unit.trim() || (activeTimer ? "session" : "step"),
      timerMinutes: activeTimer && activeTimer > 0 ? activeTimer : undefined,
      startDate: finalStartDate,
      scheduleType,
      scheduledDate: finalScheduledDate,
    };

    if (editHabitId) {
      await updateHabit(editHabitId, data);
    } else {
      await createHabit(data);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!editHabitId) return;
    await deleteHabit(editHabitId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#151619] border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-[32px] sm:rounded-3xl p-4 sm:p-5 shadow-2xl animate-pop max-h-[92dvh] overflow-y-auto pb-[max(1.75rem,env(safe-area-inset-bottom,1.5rem))]">
        {/* iOS Drag Handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
          <div>
            <span className="text-[9.5px] font-mono uppercase tracking-widest text-[#FF4F00] font-bold">
              GOAL CONFIG
            </span>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white">
              {editHabitId ? "Edit Goal" : "Create Goal"}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          {/* Row 1: Goal Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 font-bold">
                Goal Title *
              </label>
              {isDuplicateName && (
                <span className="text-[10px] font-mono font-bold text-rose-500 flex items-center gap-1 animate-pulse">
                  Already Exists
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Core Architecture"
              className={`w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border text-[15px] sm:text-sm font-medium focus:outline-none text-zinc-900 dark:text-white transition-colors ${
                isDuplicateName
                  ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                  : "border-zinc-200 dark:border-zinc-800 focus:border-[#FF4F00]"
              }`}
            />
            {isDuplicateName && (
              <p className="text-[10.5px] font-mono text-rose-500 mt-1 leading-tight animate-pop">
                A goal with this name already exists. Please choose a different title.
              </p>
            )}
          </div>

          {/* Row 2: Category & Accent Color */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
                Category
              </label>
              <div className="relative">
                <select
                  value={isCustomCategory ? "__CUSTOM__" : category}
                  onChange={(e) => {
                    if (e.target.value === "__CUSTOM__") {
                      setIsCustomCategory(true);
                    } else {
                      setIsCustomCategory(false);
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[15px] sm:text-sm font-medium focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
                >
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__CUSTOM__">Custom</option>
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Inline Custom Category input */}
              {isCustomCategory && (
                <div className="mt-1.5 animate-pop">
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Category name"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-[#FF4F00]/50 text-[15px] sm:text-sm font-medium focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 font-bold">
                  Accent Color
                </label>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block border border-black/10 dark:border-white/20"
                  style={{ backgroundColor: color }}
                />
              </div>
              <div className="relative">
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[15px] sm:text-sm font-medium focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
                >
                  <option value="#FF4F00">Swiss Orange</option>
                  <option value="#10B981">Emerald Green</option>
                  <option value="#2563EB">Cobalt Blue</option>
                  <option value="#7C3AED">Electric Violet</option>
                  <option value="#F59E0B">Signal Amber</option>
                  <option value="#F43F5E">Crimson Rose</option>
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Goal Schedule Dropdown & Focus Timer Dropdown */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Goal Schedule Dropdown */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
                Goal Schedule
              </label>
              <div className="relative">
                <select
                  value={scheduleType}
                  onChange={(e) => {
                    const val = e.target.value as GoalScheduleType;
                    setScheduleType(val);
                    if (val === "today") {
                      setStartDate(todayIso);
                      setScheduledDate(todayIso);
                    } else if (val === "daily") {
                      setStartDate(todayIso);
                    } else if (val === "schedule") {
                      if (!scheduledDate || scheduledDate < todayIso) {
                        setScheduledDate(tomorrowIso);
                      }
                    }
                  }}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[15px] sm:text-sm font-medium focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
                >
                  <option value="today">Today</option>
                  <option value="daily">Daily</option>
                  <option value="schedule">Schedule</option>
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Helper text or date input based on schedule type */}
              {scheduleType === "today" ? (
                <span className="text-[9.5px] font-mono text-zinc-400 block mt-1 leading-tight">
                  Today only • No future dates
                </span>
              ) : scheduleType === "daily" ? (
                <span className="text-[9.5px] font-mono text-zinc-400 block mt-1 leading-tight">
                  Repeats daily this month
                </span>
              ) : (
                <div className="mt-1.5 animate-pop">
                  <input
                    type="date"
                    min={todayIso}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                    className="w-full px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-[#FF4F00]/60 text-[12.5px] font-mono font-medium focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
                  />
                  <span className="text-[9px] font-mono text-zinc-400 block mt-1 leading-tight">
                    Only on {scheduledDate === tomorrowIso ? "Tomorrow" : scheduledDate}
                  </span>
                </div>
              )}
            </div>

            {/* Timer Dropdown */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
                Timer
              </label>
              <div className="relative">
                <select
                  value={
                    isCustomTimer
                      ? "__CUSTOM__"
                      : timerMinutes && [5, 10, 15, 20, 25, 30, 45, 60].includes(timerMinutes)
                      ? String(timerMinutes)
                      : timerMinutes
                      ? "__CUSTOM__"
                      : "0"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "0") {
                      setIsCustomTimer(false);
                      setTimerMinutes(null);
                    } else if (val === "__CUSTOM__") {
                      setIsCustomTimer(true);
                      if (!customTimerValue) setCustomTimerValue("30");
                    } else {
                      setIsCustomTimer(false);
                      setTimerMinutes(parseInt(val, 10));
                    }
                  }}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[15px] sm:text-sm font-medium focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
                >
                  <option value="0">Off</option>
                  <option value="5">5 Minutes</option>
                  <option value="10">10 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="20">20 Minutes</option>
                  <option value="25">25 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="__CUSTOM__">Custom</option>
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Inline Custom Timer Minutes Input */}
              {isCustomTimer ? (
                <div className="mt-1.5 flex items-center gap-1.5 animate-pop">
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={customTimerValue}
                    onChange={(e) => setCustomTimerValue(e.target.value)}
                    placeholder="Mins"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-[#FF4F00]/60 text-[15px] sm:text-sm font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF4F00]"
                  />
                  <span className="text-[10px] font-mono text-zinc-400">min</span>
                </div>
              ) : (
                <span className="text-[9.5px] font-mono text-zinc-400 block mt-1 leading-tight">
                  {timerMinutes ? "Auto-checks at 00:00" : "Timer disabled"}
                </span>
              )}
            </div>
          </div>

          {/* Row 4: Daily Target Steps & Unit Label */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Daily Target Steps with - and + */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 font-bold">
                  Daily Target
                </label>
                <span className="text-[9.5px] font-mono text-zinc-400">
                  {target === 1 ? "1 check" : `${target} steps`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTarget((t) => Math.max(1, t - 1))}
                  className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-mono text-base font-bold flex items-center justify-center transition-colors shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={target}
                  onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  required
                  className="w-full h-9 py-1 text-center rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[15px] sm:text-sm font-mono font-bold focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setTarget((t) => Math.min(50, t + 1))}
                  className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-mono text-base font-bold flex items-center justify-center transition-colors shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* Unit Label Input */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
                Unit Label
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pages, sets, reps, km"
                className="w-full h-9 px-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[15px] sm:text-sm font-medium focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
              />
              <div className="flex items-center gap-1 mt-1">
                {["pages", "sets", "reps", "km"].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`flex-1 py-0.5 rounded text-[9.5px] font-mono text-center transition-colors ${
                      unit.toLowerCase() === u
                        ? "bg-[#FF4F00] text-white font-bold"
                        : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 5: Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {editHabitId && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-mono text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={Boolean(isDuplicateName) || !name.trim()}
              className={`flex-1 py-3 rounded-2xl font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-md ${
                isDuplicateName || !name.trim()
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-[0.98]"
              }`}
            >
              {isDuplicateName ? "Goal Already Exists" : "Save Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
