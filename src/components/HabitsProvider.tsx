"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Habit, DayInfo, HabitFormData, GoalScheduleType } from "@/lib/types";
import { getCurrentWeekDays, getFallbackWeekDays, getWeekDaysForDate, getTodayIso, getTomorrowIso, getTomorrowIsoFrom, formatLocalIso, getClientTodayIso, WeekStartDay } from "@/lib/dates";
import { createDefaultDemoHabits } from "@/lib/demoData";
import { playCompletionChime } from "@/lib/sound";

export function isHabitActiveOnDate(
  habit: Habit,
  isoDate: string,
  todayIso: string
): boolean {
  // 1. If habit has any logged progress on this date, always show it!
  if (habit.logs?.some((l) => l.date === isoDate && l.value > 0)) {
    return true;
  }

  const scheduleType: GoalScheduleType = habit.scheduleType || "daily";

  if (scheduleType === "today") {
    // Single day goal: appears on targetDate
    const targetDate = habit.scheduledDate || habit.startDate || todayIso;
    return isoDate === targetDate;
  }

  if (scheduleType === "schedule") {
    // Scheduled goal: appears on specific scheduled date
    const targetDate = habit.scheduledDate || habit.startDate;
    return isoDate === targetDate;
  }

  // Daily: Active from its startDate onward into all future weeks!
  // Does NOT clutter past weeks before it was started.
  // If no startDate is set (e.g. initial demo habits), it is active across all dates.
  if (!habit.startDate) {
    return true;
  }

  return isoDate >= habit.startDate;
}

export function getCompletedLogDates(habit: Habit, todayIso: string): Set<string> {
  const completedDates = new Set<string>();
  (habit.logs || []).forEach((log) => {
    if (log.date <= todayIso && log.value >= habit.target) {
      completedDates.add(log.date);
    }
  });
  return completedDates;
}

export function computeHabitStreak(
  habit: Habit,
  todayIso: string,
  freezeUntil: string | null
): number {
  const completedDates = getCompletedLogDates(habit, todayIso);
  if (
    freezeUntil &&
    todayIso <= freezeUntil &&
    isHabitActiveOnDate(habit, todayIso, todayIso)
  ) {
    completedDates.add(todayIso);
  }
  return Math.max(0, habit.streak || 0) + completedDates.size;
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
  adjustHabitStreak: (habitId: string, delta: number) => Promise<void>;
  setManualStreak: (habitId: string, manualDays: number) => Promise<void>;
  getCompletedLogDaysCount: (habit: Habit) => number;
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
  workspaceId: string;
  syncStatus: "synced" | "syncing" | "offline";
  connectWorkspaceKey: (newKey: string) => Promise<void>;
  syncWithSupabase: () => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | null>(null);

const STORAGE_KEY = "kinetic_habits_v3";
const FRESH_START_KEY = "kinetic_fresh_started";
const WORKSPACE_ID_KEY = "kinetic_workspace_id";
const USER_NAME_KEY = "kinetic_user_name";
const WEEK_START_KEY = "kinetic_week_start_day";
const FREEZE_UNTIL_KEY = "kinetic_freeze_until";
const REMINDER_ENABLED_KEY = "kinetic_reminder_enabled";
const REMINDER_TIME_KEY = "kinetic_reminder_time";

function generateWorkspaceId(): string {
  return `kw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be used within HabitsProvider");
  return ctx;
}

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [workspaceId, setWorkspaceIdState] = useState("kinetic_default");
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("syncing");
  const [userName, setUserNameState] = useState("Karthik Marella");
  const [weekStartDay, setWeekStartDayState] = useState<WeekStartDay>("monday");
  const [freezeUntil, setFreezeUntilState] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabledState] = useState(false);
  const [reminderTime, setReminderTimeState] = useState("20:00");

  const [weekDays, setWeekDays] = useState<DayInfo[]>(() => getFallbackWeekDays());
  // todayIso must always be the real current date, independent of which week is being viewed
  const [realTodayIso, setRealTodayIso] = useState(() => getTodayIso());
  const todayIso = realTodayIso;
  const tomorrowIso = getTomorrowIsoFrom(todayIso);
  const todayObj = weekDays.find((d) => d.isToday) || weekDays[0];
  const [selectedDayIso, setSelectedDayIso] = useState(todayIso);
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
    let activeWorkspaceId = "kinetic_default";
    try {
      let savedWs = localStorage.getItem(WORKSPACE_ID_KEY);
      if (!savedWs || savedWs.trim().length < 6) {
        savedWs = generateWorkspaceId();
        localStorage.setItem(WORKSPACE_ID_KEY, savedWs);
      }
      activeWorkspaceId = savedWs.trim();
      setWorkspaceIdState(activeWorkspaceId);

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
    const realToday = getClientTodayIso();
    setRealTodayIso(realToday);
    const today = actualDays.find((d) => d.isToday) || actualDays[0];
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

    const initialLocalHabits =
      loadedHabits !== null
        ? loadedHabits
        : isFreshStarted
        ? []
        : createDefaultDemoHabits(actualDays);

    setHabits(initialLocalHabits);
    saveLocalHabits(initialLocalHabits);
    setLoading(false);

    // Sync with Supabase via API (pull remote if available, or push initial local habits up)
    (async () => {
      try {
        setSyncStatus("syncing");
        const res = await fetch("/api/habits", {
          headers: { "x-workspace-id": activeWorkspaceId },
        });
        if (!res.ok) {
          setSyncStatus("offline");
          return;
        }
        const apiData = await res.json();
        if (Array.isArray(apiData) && apiData.length > 0) {
          if (!isFreshStarted) {
            setHabits(apiData);
            saveLocalHabits(apiData);
          }
          setSyncStatus("synced");
        } else if (initialLocalHabits.length > 0 && !isFreshStarted) {
          const syncRes = await fetch("/api/habits/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-workspace-id": activeWorkspaceId,
            },
            body: JSON.stringify({ habits: initialLocalHabits }),
          });
          setSyncStatus(syncRes.ok ? "synced" : "offline");
        } else {
          setSyncStatus("synced");
        }
      } catch (_) {
        setSyncStatus("offline");
      }
    })();
  }, [saveLocalHabits]);

  // Keep realTodayIso (and current week strip) fresh across midnight or tab resume
  useEffect(() => {
    const syncDateIfRolledOver = () => {
      const latestToday = getClientTodayIso();
      if (latestToday !== realTodayIso) {
        setRealTodayIso(latestToday);
        if (weekOffset === 0) {
          const actualDays = getCurrentWeekDays(weekStartDay);
          setWeekDays(actualDays);
          if (selectedDayIso === realTodayIso) {
            setSelectedDayIso(latestToday);
          }
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncDateIfRolledOver();
        // Pull latest habits from Supabase when returning to the app
        const freshStarted = (() => {
          try {
            return localStorage.getItem(FRESH_START_KEY) === "true";
          } catch (_) {
            return false;
          }
        })();
        if (!freshStarted && workspaceId && workspaceId.length >= 6) {
          fetch("/api/habits", { headers: { "x-workspace-id": workspaceId } })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                setHabits(data);
                saveLocalHabits(data);
                setSyncStatus("synced");
              }
            })
            .catch(() => {});
        }
      }
    };

    const interval = setInterval(syncDateIfRolledOver, 60000);
    window.addEventListener("focus", syncDateIfRolledOver);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", syncDateIfRolledOver);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [realTodayIso, weekOffset, weekStartDay, selectedDayIso, workspaceId, saveLocalHabits]);

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

  const getCompletedLogDaysCount = useCallback(
    (habit: Habit): number => {
      return getCompletedLogDates(habit, todayIso).size;
    },
    [todayIso]
  );

  const calculateHabitStreak = useCallback(
    (habit: Habit): number => {
      return computeHabitStreak(habit, todayIso, freezeUntil);
    },
    [freezeUntil, todayIso]
  );

  const upsertLog = useCallback(
    async (habitId: string, date: string, value: number) => {
      try {
        const res = await fetch("/api/habits/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
          body: JSON.stringify({ habitId, date, value }),
        });
        if (res.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("offline");
          showToast("Saved locally • Cloud sync offline");
        }
      } catch (_) {
        setSyncStatus("offline");
        showToast("Saved locally • Cloud sync offline");
      }
    },
    [workspaceId, showToast]
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
      const defaultDate = selectedDayIso || todayIso;
      let scheduledDate = data.scheduledDate;
      let startDate = data.startDate;

      if (scheduleType === "today") {
        startDate = scheduledDate || defaultDate;
        scheduledDate = startDate;
      } else if (scheduleType === "daily") {
        startDate = data.startDate || defaultDate;
        scheduledDate = undefined;
      } else if (scheduleType === "schedule") {
        scheduledDate = data.scheduledDate || defaultDate;
        startDate = scheduledDate;
      }

      const manualStreak = Math.max(0, Math.floor(Number(data.streak) || 0));

      const newHabit: Habit = {
        id: `habit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: data.name,
        category: data.category,
        color: data.color,
        target: data.target,
        unit: data.unit || "session",
        streak: manualStreak,
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

      // Background server sync with Supabase
      try {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
          body: JSON.stringify({
            id: newHabit.id,
            name: data.name,
            category: data.category,
            color: data.color,
            target: data.target,
            unit: data.unit,
            streak: manualStreak,
            timerMinutes: data.timerMinutes,
            startDate,
            scheduleType,
            scheduledDate,
          }),
        });
        if (res.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("offline");
          showToast("Saved locally • Cloud sync offline");
        }
      } catch (_) {
        setSyncStatus("offline");
        showToast("Saved locally • Cloud sync offline");
      }
    },
    [habits.length, selectedDayIso, todayIso, workspaceId, saveLocalHabits, showToast]
  );

  const updateHabit = useCallback(
    async (id: string, data: Partial<HabitFormData>) => {
      const sanitizedData: Partial<HabitFormData> = {
        ...data,
        ...(data.streak !== undefined && {
          streak: Math.max(0, Math.floor(Number(data.streak) || 0)),
        }),
      };

      setHabits((prev) => {
        const next = prev.map((h) =>
          h.id === id ? { ...h, ...sanitizedData, updatedAt: new Date().toISOString() } : h
        );
        saveLocalHabits(next);
        return next;
      });

      showToast("Goal Updated");

      try {
        const res = await fetch(`/api/habits/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
          body: JSON.stringify(sanitizedData),
        });
        if (res.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("offline");
          showToast("Saved locally • Cloud sync offline");
        }
      } catch (_) {
        setSyncStatus("offline");
        showToast("Saved locally • Cloud sync offline");
      }
    },
    [workspaceId, saveLocalHabits, showToast]
  );

  const setManualStreak = useCallback(
    async (habitId: string, manualDays: number) => {
      const nextStreak = Math.max(0, Math.floor(Number(manualDays) || 0));
      setHabits((prev) => {
        const next = prev.map((h) =>
          h.id === habitId ? { ...h, streak: nextStreak, updatedAt: new Date().toISOString() } : h
        );
        saveLocalHabits(next);
        return next;
      });

      showToast(`Manual Streak: ${nextStreak}d 🔥`);

      try {
        const res = await fetch(`/api/habits/${habitId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
          body: JSON.stringify({ streak: nextStreak }),
        });
        if (res.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("offline");
          showToast("Saved locally • Cloud sync offline");
        }
      } catch (_) {
        setSyncStatus("offline");
        showToast("Saved locally • Cloud sync offline");
      }
    },
    [workspaceId, saveLocalHabits, showToast]
  );

  const adjustHabitStreak = useCallback(
    async (habitId: string, delta: number) => {
      const targetHabit = habits.find((h) => h.id === habitId);
      if (!targetHabit) return;
      const currentManual = Math.max(0, targetHabit.streak || 0);
      const nextStreak = Math.max(0, currentManual + delta);
      if (nextStreak === currentManual) return;

      setHabits((prev) => {
        const next = prev.map((h) =>
          h.id === habitId ? { ...h, streak: nextStreak, updatedAt: new Date().toISOString() } : h
        );
        saveLocalHabits(next);
        return next;
      });

      showToast(delta > 0 ? `+${delta} Streak Added 🔥` : "Manual Streak Updated");

      try {
        const res = await fetch(`/api/habits/${habitId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
          body: JSON.stringify({ streak: nextStreak }),
        });
        if (res.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("offline");
          showToast("Saved locally • Cloud sync offline");
        }
      } catch (_) {
        setSyncStatus("offline");
        showToast("Saved locally • Cloud sync offline");
      }
    },
    [habits, workspaceId, saveLocalHabits, showToast]
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
        const res = await fetch(`/api/habits/${id}`, {
          method: "DELETE",
          headers: { "x-workspace-id": workspaceId },
        });
        if (res.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("offline");
          showToast("Saved locally • Cloud sync offline");
        }
      } catch (_) {
        setSyncStatus("offline");
        showToast("Saved locally • Cloud sync offline");
      }
    },
    [workspaceId, saveLocalHabits, showToast]
  );

  const syncOrderToCloud = useCallback(
    async (ordered: Habit[]) => {
      try {
        const res = await fetch("/api/habits/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
          body: JSON.stringify({ habits: ordered }),
        });
        if (res.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("offline");
          showToast("Saved locally • Cloud sync offline");
        }
      } catch (_) {
        setSyncStatus("offline");
        showToast("Saved locally • Cloud sync offline");
      }
    },
    [workspaceId, showToast]
  );

  const moveHabitUp = useCallback(
    (habitId: string) => {
      let updatedOrder: Habit[] | null = null;
      setHabits((prev) => {
        const index = prev.findIndex((h) => h.id === habitId);
        if (index <= 0) return prev;
        const next = [...prev];
        const temp = next[index - 1];
        next[index - 1] = next[index];
        next[index] = temp;
        updatedOrder = next.map((h, i) => ({ ...h, order: i }));
        saveLocalHabits(updatedOrder);
        return updatedOrder;
      });
      if (updatedOrder) void syncOrderToCloud(updatedOrder);
      showToast("Priority Moved Up");
    },
    [saveLocalHabits, syncOrderToCloud, showToast]
  );

  const moveHabitDown = useCallback(
    (habitId: string) => {
      let updatedOrder: Habit[] | null = null;
      setHabits((prev) => {
        const index = prev.findIndex((h) => h.id === habitId);
        if (index === -1 || index >= prev.length - 1) return prev;
        const next = [...prev];
        const temp = next[index + 1];
        next[index + 1] = next[index];
        next[index] = temp;
        updatedOrder = next.map((h, i) => ({ ...h, order: i }));
        saveLocalHabits(updatedOrder);
        return updatedOrder;
      });
      if (updatedOrder) void syncOrderToCloud(updatedOrder);
      showToast("Priority Moved Down");
    },
    [saveLocalHabits, syncOrderToCloud, showToast]
  );

  const fetchHabits = useCallback(async () => {
    try {
      setSyncStatus("syncing");
      const res = await fetch("/api/habits", {
        headers: { "x-workspace-id": workspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHabits(data);
          saveLocalHabits(data);
        }
        setSyncStatus("synced");
      } else {
        setSyncStatus("offline");
      }
    } catch (_) {
      setSyncStatus("offline");
    }
  }, [workspaceId, saveLocalHabits]);

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

  const syncWithSupabase = useCallback(async () => {
    try {
      setSyncStatus("syncing");
      const res = await fetch("/api/habits", {
        headers: { "x-workspace-id": workspaceId },
      });
      if (!res.ok) {
        setSyncStatus("offline");
        showToast("Supabase sync failed");
        return;
      }
      const remoteHabits = await res.json();
      if (Array.isArray(remoteHabits) && remoteHabits.length > 0) {
        setHabits(remoteHabits);
        saveLocalHabits(remoteHabits);
        setSyncStatus("synced");
        showToast("Synced from Supabase ☁️");
      } else if (habits.length > 0) {
        const pushRes = await fetch("/api/habits/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
          body: JSON.stringify({ habits }),
        });
        setSyncStatus(pushRes.ok ? "synced" : "offline");
        showToast(pushRes.ok ? "Uploaded Habits to Supabase ☁️" : "Supabase sync failed");
      } else {
        setSyncStatus("synced");
        showToast("Supabase Connected ☁️");
      }
    } catch (_) {
      setSyncStatus("offline");
      showToast("Offline mode • Saved locally");
    }
  }, [workspaceId, habits, saveLocalHabits, showToast]);

  const connectWorkspaceKey = useCallback(
    async (newKey: string) => {
      const trimmed = newKey.trim();
      if (trimmed.length < 6) {
        showToast("Cloud Sync Key must be at least 6 characters");
        return;
      }
      setWorkspaceIdState(trimmed);
      try {
        localStorage.setItem(WORKSPACE_ID_KEY, trimmed);
      } catch (_) {}

      try {
        setSyncStatus("syncing");
        const res = await fetch("/api/habits", {
          headers: { "x-workspace-id": trimmed },
        });
        if (!res.ok) {
          setSyncStatus("offline");
          showToast("Saved Sync Key (Offline)");
          return;
        }
        const remoteHabits = await res.json();
        if (Array.isArray(remoteHabits) && remoteHabits.length > 0) {
          try {
            localStorage.removeItem(FRESH_START_KEY);
          } catch (_) {}
          setHabits(remoteHabits);
          saveLocalHabits(remoteHabits);
          setSyncStatus("synced");
          showToast("Connected & Loaded from Supabase ☁️");
        } else if (habits.length > 0) {
          const pushRes = await fetch("/api/habits/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-workspace-id": trimmed,
            },
            body: JSON.stringify({ habits }),
          });
          setSyncStatus(pushRes.ok ? "synced" : "offline");
          showToast(pushRes.ok ? "Connected & Pushed to Supabase ☁️" : "Sync Key Updated");
        } else {
          setSyncStatus("synced");
          showToast("Cloud Sync Key Connected ☁️");
        }
      } catch (_) {
        setSyncStatus("offline");
        showToast("Sync Key Saved Locally");
      }
    },
    [habits, saveLocalHabits, showToast]
  );

  const exportBackupData = useCallback(() => {
    return {
      app: "Kinetic Habit Tracker",
      version: "1.2",
      exportedAt: new Date().toISOString(),
      workspaceId,
      userName,
      weekStartDay,
      freezeUntil,
      habits,
    };
  }, [workspaceId, userName, weekStartDay, freezeUntil, habits]);

  const importBackup = useCallback(async (data: any) => {
    if (!data || !Array.isArray(data.habits)) {
      throw new Error("Invalid backup format");
    }
    const sanitizedHabits: Habit[] = data.habits.map((h: Habit) => ({
      ...h,
      streak: Math.max(0, Math.floor(Number(h.streak) || 0)),
      logs: Array.isArray(h.logs) ? h.logs : [],
    }));
    const targetWs =
      typeof data.workspaceId === "string" && data.workspaceId.trim().length >= 6
        ? data.workspaceId.trim()
        : workspaceId;
    if (targetWs !== workspaceId) {
      setWorkspaceIdState(targetWs);
      try {
        localStorage.setItem(WORKSPACE_ID_KEY, targetWs);
      } catch (_) {}
    }
    try {
      localStorage.removeItem(FRESH_START_KEY);
    } catch (_) {}
    setHabits(sanitizedHabits);
    saveLocalHabits(sanitizedHabits);
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
    try {
      const res = await fetch("/api/habits/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": targetWs,
        },
        body: JSON.stringify({ habits: sanitizedHabits, replace: true }),
      });
      setSyncStatus(res.ok ? "synced" : "offline");
    } catch (_) {
      setSyncStatus("offline");
    }
    showToast("Backup Data Restored Successfully!");
  }, [workspaceId, saveLocalHabits, setWeekStartDay, showToast]);

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
    const today = actualDays.find((d) => d.isToday) || actualDays[0];
    setSelectedDayIso(today.iso);
    showToast("Demo Data Restored");
    setLoading(false);

    try {
      const res = await fetch("/api/habits/seed", {
        method: "POST",
        headers: { "x-workspace-id": workspaceId },
      });
      if (res.ok) {
        const seeded = await res.json();
        if (Array.isArray(seeded?.habits) && seeded.habits.length > 0) {
          setHabits(seeded.habits);
          saveLocalHabits(seeded.habits);
        }
        setSyncStatus("synced");
      }
    } catch (_) {
      setSyncStatus("offline");
    }
  }, [workspaceId, saveLocalHabits, showToast]);

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
      const res = await fetch("/api/habits/seed", {
        method: "DELETE",
        headers: { "x-workspace-id": workspaceId },
      });
      setSyncStatus(res.ok ? "synced" : "offline");
    } catch (_) {
      setSyncStatus("offline");
    }
  }, [workspaceId, saveLocalHabits, showToast]);

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
        adjustHabitStreak,
        setManualStreak,
        getCompletedLogDaysCount,
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
        workspaceId,
        syncStatus,
        connectWorkspaceKey,
        syncWithSupabase,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
}
