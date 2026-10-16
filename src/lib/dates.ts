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

export function getWeekDaysForDate(targetDate: Date, realToday?: Date): DayInfo[] {
  const dayOfWeek = targetDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + diffToMonday);

  const days: DayInfo[] = [];
  const todayStr = realToday ? realToday.toDateString() : "";

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const isToday = todayStr ? d.toDateString() === todayStr : false;
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
  const fallback = new Date("2026-10-16T12:00:00Z");
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
