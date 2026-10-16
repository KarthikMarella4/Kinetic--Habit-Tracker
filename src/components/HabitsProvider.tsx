"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Habit, DayInfo } from "@/lib/types";
import { getCurrentWeekDays, getFallbackWeekDays, getWeekDaysForDate } from "@/lib/dates";
import { createDefaultDemoHabits } from "@/lib/demoData";

interface HabitsContextType {
  habits: Habit[];
  weekDays: DayInfo[];
  todayObj: DayInfo;
  selectedDayIso: string;
  setSelectedDayIso: (iso: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  activeTab: "dashboard" | "analytics" | "manage";
  setActiveTab: (tab: "dashboard" | "analytics" | "manage") => void;
  loading: boolean;
  fetchHabits: () => Promise<void>;
  createHabit: (data: { name: string; category: string; color: string; target: number; unit: string }) => Promise<void>;
  updateHabit: (id: string, data: { name: string; category: string; color: string; target: number; unit: string }) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  moveHabitUp: (habitId: string) => void;
  moveHabitDown: (habitId: string) => void;
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

const STORAGE_KEY = "kinetic_habits_v3";
const FRESH_START_KEY = "kinetic_fresh_started";
const USER_NAME_KEY = "kinetic_user_name";

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
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "manage">("dashboard");
  const [weekOffset, setWeekOffset] = useState(0);

  // Safe local storage helper
  const saveLocalHabits = useCallback((items: Habit[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  // Initialize habits on client mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(USER_NAME_KEY);
      if (savedName) setUserNameState(savedName);
    } catch (_) {}

    const actualDays = getCurrentWeekDays();
    setWeekDays(actualDays);
    const today = actualDays.find((d) => d.isToday) || actualDays[4];
    setSelectedDayIso(today.iso);

    let loadedHabits: Habit[] | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          loadedHabits = parsed;
        }
      }
    } catch (_) {}

    const isFreshStarted = (() => {
      try {
        return localStorage.getItem(FRESH_START_KEY) === "true";
      } catch (_) {
        return false;
      }
    })();

    if (loadedHabits !== null) {
      setHabits(loadedHabits);
      setLoading(false);
    } else if (isFreshStarted) {
      setHabits([]);
      saveLocalHabits([]);
      setLoading(false);
    } else {
      // First visit: Seed demo habits automatically so the user immediately sees working data
      const defaultDemo = createDefaultDemoHabits(actualDays);
      setHabits(defaultDemo);
      saveLocalHabits(defaultDemo);
      setLoading(false);
    }

    // Best-effort background sync with local SQLite API if available
    (async () => {
      try {
        const res = await fetch(`/api/habits?start=${actualDays[0].iso}&end=${actualDays[6].iso}`);
        if (res.ok) {
          const apiData = await res.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            setHabits(apiData);
            saveLocalHabits(apiData);
          }
        }
      } catch (_) {
        // Netlify serverless / offline fallback: local storage already active
      }
    })();
  }, [saveLocalHabits]);

  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim() || "Karthik Marella";
    setUserNameState(trimmed);
    try {
      localStorage.setItem(USER_NAME_KEY, trimmed);
    } catch (_) {}
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
      try {
        await fetch("/api/habits/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId, date, value }),
        });
      } catch (_) {}
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

      setHabits((prev) => {
        const next = prev.map((h) => {
          if (h.id !== habitId) return h;
          const existingLog = h.logs?.find((l) => l.date === selectedDayIso);
          const newLogs = existingLog
            ? h.logs.map((l) => (l.date === selectedDayIso ? { ...l, value: newVal } : l))
            : [...(h.logs || []), { id: `log_${Date.now()}`, habitId, date: selectedDayIso, value: newVal }];
          return { ...h, logs: newLogs };
        });
        saveLocalHabits(next);
        return next;
      });

      await upsertLog(habitId, selectedDayIso, newVal);
    },
    [habits, selectedDayIso, getLogValue, showToast, saveLocalHabits, upsertLog]
  );

  const decrementHabit = useCallback(
    async (habitId: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const current = getLogValue(habit, selectedDayIso);
      if (current <= 0) return;
      const newVal = current - 1;

      setHabits((prev) => {
        const next = prev.map((h) => {
          if (h.id !== habitId) return h;
          return {
            ...h,
            logs: (h.logs || []).map((l) => (l.date === selectedDayIso ? { ...l, value: newVal } : l)),
          };
        });
        saveLocalHabits(next);
        return next;
      });

      await upsertLog(habitId, selectedDayIso, newVal);
    },
    [habits, selectedDayIso, getLogValue, saveLocalHabits, upsertLog]
  );

  const toggleMatrixCell = useCallback(
    async (habitId: string, isoDate: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const current = getLogValue(habit, isoDate);
      const newVal = current >= habit.target ? 0 : habit.target;

      setHabits((prev) => {
        const next = prev.map((h) => {
          if (h.id !== habitId) return h;
          const existingLog = h.logs?.find((l) => l.date === isoDate);
          const newLogs = existingLog
            ? h.logs.map((l) => (l.date === isoDate ? { ...l, value: newVal } : l))
            : [...(h.logs || []), { id: `log_${Date.now()}`, habitId, date: isoDate, value: newVal }];
          return { ...h, logs: newLogs };
        });
        saveLocalHabits(next);
        return next;
      });

      showToast("Matrix Updated");
      await upsertLog(habitId, isoDate, newVal);
    },
    [habits, getLogValue, showToast, saveLocalHabits, upsertLog]
  );

  const createHabit = useCallback(
    async (data: { name: string; category: string; color: string; target: number; unit: string }) => {
      const newHabit: Habit = {
        id: `habit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: data.name,
        category: data.category,
        color: data.color,
        target: data.target,
        unit: data.unit || "session",
        streak: 0,
        order: habits.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logs: [],
      };

      setHabits((prev) => {
        const next = [...prev, newHabit];
        saveLocalHabits(next);
        return next;
      });

      showToast("New Protocol Added");

      // Background server sync if available
      try {
        await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (_) {}
    },
    [habits.length, saveLocalHabits, showToast]
  );

  const updateHabit = useCallback(
    async (id: string, data: { name: string; category: string; color: string; target: number; unit: string }) => {
      setHabits((prev) => {
        const next = prev.map((h) =>
          h.id === id ? { ...h, ...data, updatedAt: new Date().toISOString() } : h
        );
        saveLocalHabits(next);
        return next;
      });

      showToast("Habit Updated");

      try {
        await fetch(`/api/habits/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (_) {}
    },
    [saveLocalHabits, showToast]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      setHabits((prev) => {
        const next = prev.filter((h) => h.id !== id);
        saveLocalHabits(next);
        return next;
      });

      showToast("Habit Removed");

      try {
        await fetch(`/api/habits/${id}`, { method: "DELETE" });
      } catch (_) {}
    },
    [saveLocalHabits, showToast]
  );

  const moveHabitUp = useCallback(
    (habitId: string) => {
      setHabits((prev) => {
        const index = prev.findIndex((h) => h.id === habitId);
        if (index <= 0) return prev;
        const next = [...prev];
        const temp = next[index - 1];
        next[index - 1] = next[index];
        next[index] = temp;
        saveLocalHabits(next);
        return next;
      });
      showToast("Priority Moved Up");
    },
    [saveLocalHabits, showToast]
  );

  const moveHabitDown = useCallback(
    (habitId: string) => {
      setHabits((prev) => {
        const index = prev.findIndex((h) => h.id === habitId);
        if (index === -1 || index >= prev.length - 1) return prev;
        const next = [...prev];
        const temp = next[index + 1];
        next[index + 1] = next[index];
        next[index] = temp;
        saveLocalHabits(next);
        return next;
      });
      showToast("Priority Moved Down");
    },
    [saveLocalHabits, showToast]
  );

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch(`/api/habits?start=${weekDays[0].iso}&end=${weekDays[6].iso}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHabits(data);
          saveLocalHabits(data);
        }
      }
    } catch (_) {}
  }, [weekDays, saveLocalHabits]);

  const changeWeek = useCallback(
    (offset: number) => {
      setWeekOffset(offset);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + offset * 7);
      const days = getWeekDaysForDate(targetDate, new Date());
      setWeekDays(days);
      const todayInWeek = days.find((d) => d.isToday);
      setSelectedDayIso(todayInWeek ? todayInWeek.iso : days[0].iso);
    },
    []
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
      localStorage.removeItem(FRESH_START_KEY);
    } catch (_) {}
    setWeekOffset(0);
    const actualDays = getCurrentWeekDays();
    setWeekDays(actualDays);
    const demoHabits = createDefaultDemoHabits(actualDays);
    saveLocalHabits(demoHabits);
    setHabits(demoHabits);
    const today = actualDays.find((d) => d.isToday) || actualDays[4];
    setSelectedDayIso(today.iso);
    showToast("Demo Data Restored");
    setLoading(false);

    try {
      await fetch("/api/habits/seed", { method: "POST" });
    } catch (_) {}
  }, [saveLocalHabits, showToast]);

  const clearAllData = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.setItem(FRESH_START_KEY, "true");
    } catch (_) {}
    saveLocalHabits([]);
    setHabits([]);
    showToast("All Habits Cleared • Fresh Board Ready");
    setLoading(false);

    try {
      await fetch("/api/habits/seed", { method: "DELETE" });
    } catch (_) {}
  }, [saveLocalHabits, showToast]);

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
        moveHabitUp,
        moveHabitDown,
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
