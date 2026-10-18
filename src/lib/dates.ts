import { DayInfo } from "./types";

const shortNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const fullNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const months = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export function formatLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function getWeekDaysForDate(targetDate: Date, realToday?: Date): DayInfo[] {
  const dayOfWeek = targetDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate() + diffToMonday,
    12,
    0,
    0
  );

  const days: DayInfo[] = [];
  const todayIso = realToday ? formatLocalIso(realToday) : getTodayIso();

  for (let i = 0; i < 7; i++) {
    const d = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + i,
      12,
      0,
      0
    );
    const iso = formatLocalIso(d);
    const isToday = iso === todayIso;
    days.push({
      index: i,
      iso,
      shortDay: shortNames[i],
      fullDay: fullNames[i],
      dateNum: d.getDate(),
      month: months[d.getMonth()],
      isToday,
    });
  }
  return days;
}

export function getCurrentWeekDays(): DayInfo[] {
  const now = new Date();
  return getWeekDaysForDate(now, now);
}

export function getFallbackWeekDays(): DayInfo[] {
  // Deterministic 2026-10-16 for static prerender
  const fallback = new Date(2026, 9, 16, 12, 0, 0);
  return getWeekDaysForDate(fallback, fallback);
}

export function getWeekIsoRange(weekDays: DayInfo[]): {
  start: string;
  end: string;
} {
  return {
    start: weekDays[0].iso,
    end: weekDays[6].iso,
  };
}

export function getTomorrowIsoFrom(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const next = new Date(year, month - 1, day + 1, 12, 0, 0);
  return formatLocalIso(next);
}

export function getTodayIso(): string {
  if (typeof window === "undefined") {
    return "2026-10-16";
  }
  return formatLocalIso(new Date());
}

export function getTomorrowIso(): string {
  if (typeof window === "undefined") {
    return "2026-10-17";
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatLocalIso(tomorrow);
}
