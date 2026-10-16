export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  value: number;
}

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
}

export interface HabitFormData {
  name: string;
  category: string;
  color: string;
  target: number;
  unit: string;
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
