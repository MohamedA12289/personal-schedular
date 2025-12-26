const DAY_MS = 24 * 60 * 60 * 1000;

export const MONTH_NAME_TO_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export const WEEKDAY_NAME_TO_INDEX: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

export function getMonthIndex(token: string) {
  return MONTH_NAME_TO_INDEX[token.toLowerCase()];
}

export function getWeekdayIndex(token: string) {
  return WEEKDAY_NAME_TO_INDEX[token.toLowerCase()];
}

export function buildDateWithYearFallback(monthIndex: number, day: number, reference: Date, explicitYear?: number) {
  const year = explicitYear ?? reference.getFullYear();
  const candidate = new Date(year, monthIndex, day);
  if (explicitYear !== undefined) return candidate;
  if (startOfDay(candidate) < startOfDay(reference)) {
    return new Date(year + 1, monthIndex, day);
  }
  return candidate;
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString(undefined, options);
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfWeek(date: Date, weekStartsOn: number = 0) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  return addDays(d, -diff);
}

export function getMonthMatrix(current: Date, weekStartsOn: number = 0) {
  const startMonth = startOfMonth(current);
  const endMonthVal = endOfMonth(current);
  const startDate = startOfWeek(startMonth, weekStartsOn);
  const weeks: Date[][] = [];
  let cursor = startDate;
  while (cursor <= endMonthVal || weeks.length < 6) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    if (cursor.getMonth() > endMonthVal.getMonth() && cursor.getDate() > 7) break;
  }
  return weeks;
}

export function getWeekForDate(date: Date, weekStartsOn: number = 0) {
  const start = startOfWeek(date, weekStartsOn);
  return Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
}

export function minutesSinceStartOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function clampDateToDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function parseTimeText(text: string) {
  const normalized = text.trim().toLowerCase();

  // Quick mappings for common phrases
  if (normalized.includes("noon")) return { hours: 12, minutes: 0 };
  if (normalized.includes("midnight")) return { hours: 0, minutes: 0 };
  // "after lunch" is treated as early afternoon for casual phrasing
  if (normalized.includes("after lunch")) return { hours: 13, minutes: 0 };

  const match = normalized.match(/(\d{1,2})(?::(\d{2}))?\s?(am|pm|a|p)?/i);
  if (!match) return null;
  const hour = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const period = match[3]?.toLowerCase();
  let hours = hour;

  if (period === "pm" || period === "p") {
    if (hour !== 12) hours += 12;
  } else if (period === "am" || period === "a") {
    if (hour === 12) hours = 0;
  }

  return { hours, minutes };
}

export function formatWeekdayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

export function getUpcomingDates(count: number, startDate = new Date()) {
  return Array.from({ length: count }, (_, idx) => addDays(startDate, idx));
}

export function getRelativeDayLabel(date: Date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((target.getTime() - today.getTime()) / DAY_MS);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return formatDate(date, { weekday: "short", month: "short", day: "numeric" });
}

export function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getYearMonthsMatrix(year: number, weekStartsOn = 0) {
  return Array.from({ length: 12 }, (_, month) => getMonthMatrix(new Date(year, month, 1), weekStartsOn));
}
