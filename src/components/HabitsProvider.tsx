"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Habit, DayInfo, HabitFormData, GoalScheduleType } from "@/lib/types";
import { getCurrentWeekDays, getFallbackWeekDays, getWeekDaysForDate, getTodayIso, getTomorrowIso, getTomorrowIsoFrom, formatLocalIso, WeekStartDay } from "@/lib/dates";
import { createDefaultDemoHabits } from "@/lib/demoData";
import { playCompletionChime } from "@/lib/sound";

export function isHabitActiveOnDate(
  habit: Habit,
  isoDate: string,
  todayIso: string
): boolean {
  const scheduleType: GoalScheduleType = habit.scheduleType || "daily";

  if (scheduleType === "today") {
    // Today: The goal should appear only on the current day. It must not appear on any future dates.
    const targetDate = habit.scheduledDate || habit.startDate || todayIso;
    return isoDate === targetDate && isoDate <= todayIso;
  }

  if (scheduleType === "schedule") {
    // Schedule: The goal should appear only on the specific scheduled date or dates selected by the user.
    // Do not automatically display the goal on additional future dates that were not selected.
    const targetDate = habit.scheduledDate || habit.startDate;
    return isoDate === targetDate;
  }

  // Daily: The goal should appear every day of the month, including today and all subsequent days in the current month.
  // It should follow the calendar dates correctly.
  const start = habit.startDate || todayIso;
  return !habit.startDate || isoDate >= start;
}

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
  createHabit: (data: HabitFormData) => Promise<void>;
  updateHabit: (id: string, data: Partial<HabitFormData>) => Promise<void>;
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
  isHabitActiveOnDate: (habit: Habit, isoDate: string) => boolean;
  userName: string;
  setUserName: (name: string) => void;
  clearAllData: () => Promise<void>;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  jumpToToday: () => void;
  isCurrentWeek: boolean;
  weekOffset: number;
  todayIso: string;
  tomorrowIso: string;
  toast: string | null;
  showToast: (msg: string) => void;
  weekStartDay: WeekStartDay;
  setWeekStartDay: (start: WeekStartDay) => void;
  freezeUntil: string | null;
  setStreakFreeze: (days: number) => void;
  isFreezeActive: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  setReminderSettings: (enabled: boolean, time: string) => Promise<boolean>;
  sendTestNotification: () => void;
  exportBackupData: () => any;
  importBackup: (data: any) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | null>(null);

const STORAGE_KEY = "kinetic_habits_v3";
const FRESH_START_KEY = "kinetic_fresh_started";
const USER_NAME_KEY = "kinetic_user_name";
const WEEK_START_KEY = "kinetic_week_start_day";
const FREEZE_UNTIL_KEY = "kinetic_freeze_until";
const REMINDER_ENABLED_KEY = "kinetic_reminder_enabled";
const REMINDER_TIME_KEY = "kinetic_reminder_time";

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
  const [weekStartDay, setWeekStartDayState] = useState<WeekStartDay>("monday");
  const [freezeUntil, setFreezeUntilState] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabledState] = useState(false);
  const [reminderTime, setReminderTimeState] = useState("20:00");

  const [weekDays, setWeekDays] = useState<DayInfo[]>(() => getFallbackWeekDays());
  const todayObj = weekDays.find((d) => d.isToday) || weekDays[4];
  const todayIso = todayObj.iso;
  const tomorrowIso = getTomorrowIsoFrom(todayIso);
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
    let initialWeekStart: WeekStartDay = "monday";
    try {
      const savedName = localStorage.getItem(USER_NAME_KEY);
      if (savedName) setUserNameState(savedName);

      const savedStart = localStorage.getItem(WEEK_START_KEY) as WeekStartDay;
      if (savedStart === "sunday" || savedStart === "monday") {
        initialWeekStart = savedStart;
        setWeekStartDayState(savedStart);
      }

      const savedFreeze = localStorage.getItem(FREEZE_UNTIL_KEY);
      if (savedFreeze) setFreezeUntilState(savedFreeze);

      const savedRemEnabled = localStorage.getItem(REMINDER_ENABLED_KEY);
      if (savedRemEnabled === "true") setReminderEnabledState(true);

      const savedRemTime = localStorage.getItem(REMINDER_TIME_KEY);
      if (savedRemTime) setReminderTimeState(savedRemTime);
    } catch (_) {}

    const actualDays = getCurrentWeekDays(initialWeekStart);
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

    // Optional background sync with SQLite API only if local storage was empty
    (async () => {
      try {
        if (loadedHabits === null && !isFreshStarted) {
          const res = await fetch(`/api/habits?start=${actualDays[0].iso}&end=${actualDays[6].iso}`);
          if (res.ok) {
            const apiData = await res.json();
            if (Array.isArray(apiData) && apiData.length > 0) {
              setHabits(apiData);
              saveLocalHabits(apiData);
            }
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

  const checkIsHabitActive = useCallback(
    (habit: Habit, isoDate: string): boolean => {
      return isHabitActiveOnDate(habit, isoDate, todayIso);
    },
    [todayIso]
  );

  const getDayCompletionPercent = useCallback(
    (isoDate: string): number => {
      // Only include habits that are active on this day per scheduling rules
      const activeForDay = habits.filter((h) => checkIsHabitActive(h, isoDate));
      if (activeForDay.length === 0) return 0;
      let totalScore = 0;
      activeForDay.forEach((h) => {
        const val = getLogValue(h, isoDate);
        totalScore += Math.min(1, val / h.target);
      });
      return Math.round((totalScore / activeForDay.length) * 100);
    },
    [habits, checkIsHabitActive, getLogValue]
  );

  const getDayCompletedCount = useCallback(
    (isoDate: string): number => {
      const activeForDay = habits.filter((h) => checkIsHabitActive(h, isoDate));
      let completed = 0;
      activeForDay.forEach((h) => {
        if (getLogValue(h, isoDate) >= h.target) completed++;
      });
      return completed;
    },
    [habits, checkIsHabitActive, getLogValue]
  );

  const isFreezeActive = Boolean(freezeUntil && todayIso <= freezeUntil);

  const calculateHabitStreak = useCallback(
    (habit: Habit): number => {
      let currentWeekComplete = 0;
      weekDays.forEach((d) => {
        // Only count days where the habit was active
        if (checkIsHabitActive(habit, d.iso)) {
          const val = getLogValue(habit, d.iso);
          const isDayFrozen = freezeUntil ? d.iso <= freezeUntil && d.iso >= todayIso : false;
          if (val >= habit.target || isDayFrozen) currentWeekComplete++;
        }
      });
      return (habit.streak || 0) + currentWeekComplete;
    },
    [weekDays, checkIsHabitActive, getLogValue, freezeUntil, todayIso]
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
        if (newVal === habit.target) {
          playCompletionChime();
          showToast("Completed! +1 Streak 🔥");
        }
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
    async (data: HabitFormData) => {
      const scheduleType: GoalScheduleType = data.scheduleType || "daily";
      let scheduledDate = data.scheduledDate;
      let startDate = data.startDate;

      if (scheduleType === "today") {
        startDate = todayIso;
        scheduledDate = todayIso;
      } else if (scheduleType === "daily") {
        startDate = data.startDate || todayIso;
        scheduledDate = undefined;
      } else if (scheduleType === "schedule") {
        scheduledDate = data.scheduledDate || tomorrowIso;
        startDate = scheduledDate;
      }

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
        startDate,
        scheduleType,
        scheduledDate,
        timerMinutes: data.timerMinutes,
        logs: [],
      };

      setHabits((prev) => {
        const next = [...prev, newHabit];
        saveLocalHabits(next);
        return next;
      });

      showToast("New Goal Added");

      // Background server sync if available
      try {
        await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            category: data.category,
            color: data.color,
            target: data.target,
            unit: data.unit,
          }),
        });
      } catch (_) {}
    },
    [habits.length, todayIso, tomorrowIso, saveLocalHabits, showToast]
  );

  const updateHabit = useCallback(
    async (id: string, data: Partial<HabitFormData>) => {
      setHabits((prev) => {
        const next = prev.map((h) =>
          h.id === id ? { ...h, ...data, updatedAt: new Date().toISOString() } : h
        );
        saveLocalHabits(next);
        return next;
      });

      showToast("Goal Updated");

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
      const days = getWeekDaysForDate(targetDate, new Date(), weekStartDay);
      setWeekDays(days);
      const todayInWeek = days.find((d) => d.isToday);
      setSelectedDayIso(todayInWeek ? todayInWeek.iso : days[0].iso);
    },
    [weekStartDay]
  );

  const setWeekStartDay = useCallback((start: WeekStartDay) => {
    setWeekStartDayState(start);
    try {
      localStorage.setItem(WEEK_START_KEY, start);
    } catch (_) {}
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + weekOffset * 7);
    const days = getWeekDaysForDate(targetDate, now, start);
    setWeekDays(days);
  }, [weekOffset]);

  const setStreakFreeze = useCallback((days: number) => {
    if (days <= 0) {
      setFreezeUntilState(null);
      try {
        localStorage.removeItem(FREEZE_UNTIL_KEY);
      } catch (_) {}
      showToast("Streak Freeze Deactivated");
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + (days - 1));
    const untilIso = formatLocalIso(d);
    setFreezeUntilState(untilIso);
    try {
      localStorage.setItem(FREEZE_UNTIL_KEY, untilIso);
    } catch (_) {}
    showToast(`Streak Frozen for ${days} Day${days > 1 ? "s" : ""} ❄️`);
  }, [showToast]);

  const setReminderSettings = useCallback(async (enabled: boolean, time: string) => {
    if (enabled && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          showToast("Notification permission denied in browser");
          setReminderEnabledState(false);
          try {
            localStorage.setItem(REMINDER_ENABLED_KEY, "false");
          } catch (_) {}
          return false;
        }
      }
    }

    setReminderEnabledState(enabled);
    setReminderTimeState(time);
    try {
      localStorage.setItem(REMINDER_ENABLED_KEY, enabled ? "true" : "false");
      localStorage.setItem(REMINDER_TIME_KEY, time);
    } catch (_) {}
    const [hStr, mStr] = (time || "20:00").split(":");
    let h = parseInt(hStr || "20", 10);
    if (isNaN(h)) h = 20;
    const m = mStr && mStr.length === 2 ? mStr : "00";
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const formatted12 = `${String(h12).padStart(2, "0")}:${m} ${period}`;

    showToast(enabled ? `Reminder set for ${formatted12}` : "Reminder Disabled");
    return true;
  }, [showToast]);

  const sendTestNotification = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      showToast("Notifications not supported in this browser");
      return;
    }
    const activeToday = habits.filter((h) => checkIsHabitActive(h, todayIso));
    const uncompleted = activeToday.filter((h) => getLogValue(h, todayIso) < h.target).length;
    const bestStreak = habits.length > 0 ? habits.reduce((acc, h) => Math.max(acc, calculateHabitStreak(h)), 0) : 0;
    const remainingCount = uncompleted > 0 ? uncompleted : 2;
    const streakDisplay = bestStreak > 0 ? bestStreak : 26;
    const notifBody = `${userName}, you have ${remainingCount} protocol${remainingCount > 1 ? "s" : ""} remaining to protect your ${streakDisplay}-day streak! 🔥`;

    const triggerNotification = () => {
      new Notification("Kinetic Focus Reminder", {
        body: notifBody,
      });
      showToast("Test notification sent!");
    };

    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          triggerNotification();
        } else {
          showToast("Permission denied in browser");
        }
      });
    } else {
      triggerNotification();
    }
  }, [habits, checkIsHabitActive, todayIso, getLogValue, calculateHabitStreak, userName, showToast]);

  // Periodic reminder checker
  useEffect(() => {
    if (!reminderEnabled || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (currentHHMM === reminderTime) {
        const lastSentKey = "kinetic_last_reminder_sent";
        const lastSent = localStorage.getItem(lastSentKey);
        if (lastSent !== todayIso) {
          const activeToday = habits.filter((h) => checkIsHabitActive(h, todayIso));
          const uncompleted = activeToday.filter((h) => getLogValue(h, todayIso) < h.target).length;
          const bestStreak = habits.length > 0 ? habits.reduce((acc, h) => Math.max(acc, calculateHabitStreak(h)), 0) : 0;
          if (uncompleted > 0) {
            new Notification("Kinetic Focus Reminder", {
              body: `${userName}, you have ${uncompleted} protocol${uncompleted > 1 ? "s" : ""} remaining to protect your ${bestStreak}-day streak! 🔥`,
            });
            localStorage.setItem(lastSentKey, todayIso);
          }
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [reminderEnabled, reminderTime, todayIso, habits, checkIsHabitActive, getLogValue, calculateHabitStreak, userName]);

  const exportBackupData = useCallback(() => {
    return {
      app: "Kinetic Habit Tracker",
      version: "1.2",
      exportedAt: new Date().toISOString(),
      userName,
      weekStartDay,
      freezeUntil,
      habits,
    };
  }, [userName, weekStartDay, freezeUntil, habits]);

  const importBackup = useCallback(async (data: any) => {
    if (!data || !Array.isArray(data.habits)) {
      throw new Error("Invalid backup format");
    }
    setHabits(data.habits);
    saveLocalHabits(data.habits);
    if (data.userName) {
      setUserNameState(data.userName);
      try {
        localStorage.setItem(USER_NAME_KEY, data.userName);
      } catch (_) {}
    }
    if (data.weekStartDay && (data.weekStartDay === "monday" || data.weekStartDay === "sunday")) {
      setWeekStartDay(data.weekStartDay);
    }
    if (data.freezeUntil) {
      setFreezeUntilState(data.freezeUntil);
      try {
        localStorage.setItem(FREEZE_UNTIL_KEY, data.freezeUntil);
      } catch (_) {}
    }
    showToast("Backup Data Restored Successfully!");
  }, [saveLocalHabits, setWeekStartDay, showToast]);

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
        todayIso,
        tomorrowIso,
        getLogValue,
        getDayCompletionPercent,
        getDayCompletedCount,
        calculateHabitStreak,
        isHabitActiveOnDate: checkIsHabitActive,
        toast,
        showToast,
        weekStartDay,
        setWeekStartDay,
        freezeUntil,
        setStreakFreeze,
        isFreezeActive,
        reminderEnabled,
        reminderTime,
        setReminderSettings,
        sendTestNotification,
        exportBackupData,
        importBackup,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
}
