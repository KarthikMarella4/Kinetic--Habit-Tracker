"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Habit, DayInfo } from "@/lib/types";
import { getCurrentWeekDays, getFallbackWeekDays, getWeekDaysForDate } from "@/lib/dates";

interface HabitsContextType {
  habits: Habit[];
  weekDays: DayInfo[];
  todayObj: DayInfo;
  selectedDayIso: string;
  setSelectedDayIso: (iso: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  activeTab: "dashboard" | "analytics";
  setActiveTab: (tab: "dashboard" | "analytics") => void;
  loading: boolean;
  fetchHabits: () => Promise<void>;
  createHabit: (data: { name: string; category: string; color: string; target: number; unit: string }) => Promise<void>;
  updateHabit: (id: string, data: { name: string; category: string; color: string; target: number; unit: string }) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  incrementHabit: (habitId: string) => Promise<void>;
  decrementHabit: (habitId: string) => Promise<void>;
  toggleMatrixCell: (habitId: string, isoDate: string) => Promise<void>;
  seedDemo: () => Promise<void>;
  getLogValue: (habit: Habit, isoDate: string) => number;
  getDayCompletionPercent: (isoDate: string) => number;
  getDayCompletedCount: (isoDate: string) => number;
  calculateHabitStreak: (habit: Habit) => number;
  userName: string;
  setUserName: (name: string) => void;
  clearAllData: () => Promise<void>;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  jumpToToday: () => void;
  isCurrentWeek: boolean;
  weekOffset: number;
  toast: string | null;
  showToast: (msg: string) => void;
}

const HabitsContext = createContext<HabitsContextType | null>(null);

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be used within HabitsProvider");
  return ctx;
}

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [userName, setUserNameState] = useState("Karthik Marella");

  const [weekDays, setWeekDays] = useState<DayInfo[]>(() => getFallbackWeekDays());
  const todayObj = weekDays.find((d) => d.isToday) || weekDays[4];
  const [selectedDayIso, setSelectedDayIso] = useState(todayObj.iso);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics">("dashboard");

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("kinetic_user_name");
      if (savedName) setUserNameState(savedName);
    } catch (_) {}
  }, []);

  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim() || "Karthik Marella";
    setUserNameState(trimmed);
    try {
      localStorage.setItem("kinetic_user_name", trimmed);
    } catch (_) {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const fetchHabitsForDays = useCallback(async (days: DayInfo[]) => {
    try {
      const res = await fetch(`/api/habits?start=${days[0].iso}&end=${days[6].iso}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (Array.isArray(data) && data.length === 0) {
        let isFreshStarted = false;
        try {
          isFreshStarted = localStorage.getItem("kinetic_fresh_started") === "true";
        } catch (_) {}

        if (!isFreshStarted) {
          try {
            localStorage.setItem("kinetic_fresh_started", "true");
          } catch (_) {}
          await fetch("/api/habits/seed", { method: "POST" });
          const seededRes = await fetch(`/api/habits?start=${days[0].iso}&end=${days[6].iso}`);
          const seededData = await seededRes.json();
          setHabits(seededData);
        } else {
          setHabits([]);
        }
      } else {
        setHabits(data);
      }
    } catch (err) {
      console.error("Fetch habits error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHabits = useCallback(async () => {
    await fetchHabitsForDays(weekDays);
  }, [fetchHabitsForDays, weekDays]);

  useEffect(() => {
    const actualDays = getCurrentWeekDays();
    setWeekDays(actualDays);
    const today = actualDays.find((d) => d.isToday) || actualDays[4];
    setSelectedDayIso(today.iso);
    fetchHabitsForDays(actualDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLogValue = useCallback((habit: Habit, isoDate: string): number => {
    const log = habit.logs?.find((l) => l.date === isoDate);
    return log?.value ?? 0;
  }, []);

  const getDayCompletionPercent = useCallback(
    (isoDate: string): number => {
      if (habits.length === 0) return 0;
      let totalScore = 0;
      habits.forEach((h) => {
        const val = getLogValue(h, isoDate);
        totalScore += Math.min(1, val / h.target);
      });
      return Math.round((totalScore / habits.length) * 100);
    },
    [habits, getLogValue]
  );

  const getDayCompletedCount = useCallback(
    (isoDate: string): number => {
      let completed = 0;
      habits.forEach((h) => {
        if (getLogValue(h, isoDate) >= h.target) completed++;
      });
      return completed;
    },
    [habits, getLogValue]
  );

  const calculateHabitStreak = useCallback(
    (habit: Habit): number => {
      let currentWeekComplete = 0;
      weekDays.forEach((d) => {
        if (getLogValue(habit, d.iso) >= habit.target) currentWeekComplete++;
      });
      return (habit.streak || 0) + currentWeekComplete;
    },
    [weekDays, getLogValue]
  );

  const upsertLog = useCallback(
    async (habitId: string, date: string, value: number) => {
      await fetch("/api/habits/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date, value }),
      });
    },
    []
  );

  const incrementHabit = useCallback(
    async (habitId: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const current = getLogValue(habit, selectedDayIso);
      let newVal: number;
      if (current >= habit.target) {
        newVal = 0;
        showToast(`Reset ${habit.name}`);
      } else {
        newVal = current + 1;
        if (newVal === habit.target) showToast("Completed! +1 Streak 🔥");
      }
      // Optimistic update
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          const existingLog = h.logs.find((l) => l.date === selectedDayIso);
          const newLogs = existingLog
            ? h.logs.map((l) => (l.date === selectedDayIso ? { ...l, value: newVal } : l))
            : [...h.logs, { id: "temp", habitId, date: selectedDayIso, value: newVal }];
          return { ...h, logs: newLogs };
        })
      );
      await upsertLog(habitId, selectedDayIso, newVal);
    },
    [habits, selectedDayIso, getLogValue, upsertLog, showToast]
  );

  const decrementHabit = useCallback(
    async (habitId: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const current = getLogValue(habit, selectedDayIso);
      if (current <= 0) return;
      const newVal = current - 1;
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          return {
            ...h,
            logs: h.logs.map((l) => (l.date === selectedDayIso ? { ...l, value: newVal } : l)),
          };
        })
      );
      await upsertLog(habitId, selectedDayIso, newVal);
    },
    [habits, selectedDayIso, getLogValue, upsertLog]
  );

  const toggleMatrixCell = useCallback(
    async (habitId: string, isoDate: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const current = getLogValue(habit, isoDate);
      const newVal = current >= habit.target ? 0 : habit.target;
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          const existingLog = h.logs.find((l) => l.date === isoDate);
          const newLogs = existingLog
            ? h.logs.map((l) => (l.date === isoDate ? { ...l, value: newVal } : l))
            : [...h.logs, { id: "temp", habitId, date: isoDate, value: newVal }];
          return { ...h, logs: newLogs };
        })
      );
      await upsertLog(habitId, isoDate, newVal);
      showToast("Matrix Updated");
    },
    [habits, getLogValue, upsertLog, showToast]
  );

  const createHabit = useCallback(
    async (data: { name: string; category: string; color: string; target: number; unit: string }) => {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchHabits();
        showToast("New Protocol Added");
      }
    },
    [fetchHabits, showToast]
  );

  const updateHabit = useCallback(
    async (id: string, data: { name: string; category: string; color: string; target: number; unit: string }) => {
      const res = await fetch(`/api/habits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchHabits();
        showToast("Habit Updated");
      }
    },
    [fetchHabits, showToast]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchHabits();
        showToast("Habit Removed");
      }
    },
    [fetchHabits, showToast]
  );

  const [weekOffset, setWeekOffset] = useState(0);

  const changeWeek = useCallback(
    async (offset: number) => {
      setLoading(true);
      setWeekOffset(offset);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + offset * 7);
      const days = getWeekDaysForDate(targetDate, new Date());
      setWeekDays(days);
      const todayInWeek = days.find((d) => d.isToday);
      setSelectedDayIso(todayInWeek ? todayInWeek.iso : days[0].iso);
      await fetchHabitsForDays(days);
      setLoading(false);
    },
    [fetchHabitsForDays]
  );

  const goToPreviousWeek = useCallback(() => {
    changeWeek(weekOffset - 1);
  }, [changeWeek, weekOffset]);

  const goToNextWeek = useCallback(() => {
    changeWeek(weekOffset + 1);
  }, [changeWeek, weekOffset]);

  const jumpToToday = useCallback(() => {
    changeWeek(0);
    showToast("Jumped to Today");
  }, [changeWeek, showToast]);

  const isCurrentWeek = weekOffset === 0;

  const seedDemo = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.removeItem("kinetic_fresh_started");
    } catch (_) {}
    setWeekOffset(0);
    const actualDays = getCurrentWeekDays();
    setWeekDays(actualDays);
    await fetch("/api/habits/seed", { method: "POST" });
    await fetchHabitsForDays(actualDays);
    const today = actualDays.find((d) => d.isToday) || actualDays[4];
    setSelectedDayIso(today.iso);
    showToast("Demo Data Restored");
    setLoading(false);
  }, [fetchHabitsForDays, showToast]);

  const clearAllData = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.setItem("kinetic_fresh_started", "true");
    } catch (_) {}
    await fetch("/api/habits/seed", { method: "DELETE" });
    setHabits([]);
    showToast("All Habits Cleared • Fresh Board Ready");
    setLoading(false);
  }, [showToast]);

  return (
    <HabitsContext.Provider
      value={{
        habits,
        weekDays,
        todayObj,
        selectedDayIso,
        setSelectedDayIso,
        selectedCategory,
        setSelectedCategory,
        activeTab,
        setActiveTab,
        loading,
        fetchHabits,
        createHabit,
        updateHabit,
        deleteHabit,
        incrementHabit,
        decrementHabit,
        toggleMatrixCell,
        seedDemo,
        clearAllData,
        userName,
        setUserName,
        goToPreviousWeek,
        goToNextWeek,
        jumpToToday,
        isCurrentWeek,
        weekOffset,
        getLogValue,
        getDayCompletionPercent,
        getDayCompletedCount,
        calculateHabitStreak,
        toast,
        showToast,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
}
