export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  value: number;
}

export type GoalScheduleType = "today" | "daily" | "schedule";

export interface Habit {
  id: string;
  name: string;
  category: string;
  color: string;
  target: number;
  unit: string;
  streak: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  logs: HabitLog[];
  timerMinutes?: number;
  startDate?: string; // ISO date YYYY-MM-DD
  scheduleType?: GoalScheduleType;
  scheduledDate?: string; // ISO date YYYY-MM-DD for "schedule" or "today"
}

export interface HabitFormData {
  name: string;
  category: string;
  color: string;
  target: number;
  unit: string;
  timerMinutes?: number;
  startDate?: string;
  scheduleType?: GoalScheduleType;
  scheduledDate?: string;
}

export interface DayInfo {
  index: number;
  iso: string;
  shortDay: string;
  fullDay: string;
  dateNum: number;
  month: string;
  isToday: boolean;
}
