import { GoalScheduleType, Habit, HabitLog } from "@/lib/types";

export interface DbHabitRow {
  id: string;
  workspace_id: string;
  name: string;
  category: string;
  color: string;
  target: number;
  unit: string;
  streak: number;
  sort_order: number;
  timer_minutes: number | null;
  start_date: string | null;
  schedule_type: string | null;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
  habit_logs?: DbHabitLogRow[];
}

export interface DbHabitLogRow {
  id: string;
  habit_id: string;
  workspace_id: string;
  date: string;
  value: number;
  created_at?: string;
  updated_at?: string;
}

export function mapDbLogToHabitLog(row: DbHabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    value: row.value,
  };
}

export function mapDbHabitToHabit(row: DbHabitRow): Habit {
  const scheduleType = (
    row.schedule_type === "today" || row.schedule_type === "schedule"
      ? row.schedule_type
      : "daily"
  ) as GoalScheduleType;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    color: row.color,
    target: row.target,
    unit: row.unit,
    streak: row.streak ?? 0,
    order: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timerMinutes: row.timer_minutes ?? undefined,
    startDate: row.start_date ?? undefined,
    scheduleType,
    scheduledDate: row.scheduled_date ?? undefined,
    logs: Array.isArray(row.habit_logs) ? row.habit_logs.map(mapDbLogToHabitLog) : [],
  };
}

export function mapHabitToDbRow(habit: Habit, workspaceId: string, index?: number) {
  return {
    id: habit.id,
    workspace_id: workspaceId,
    name: habit.name,
    category: habit.category,
    color: habit.color,
    target: Math.max(1, Math.floor(Number(habit.target) || 1)),
    unit: habit.unit || "session",
    streak: Math.max(0, Math.floor(Number(habit.streak) || 0)),
    sort_order: typeof index === "number" ? index : habit.order ?? 0,
    timer_minutes: habit.timerMinutes ?? null,
    start_date: habit.startDate ?? null,
    schedule_type: habit.scheduleType || "daily",
    scheduled_date: habit.scheduledDate ?? null,
    updated_at: new Date().toISOString(),
  };
}
