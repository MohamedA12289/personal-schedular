import { addDays, parseTimeText, startOfDay } from "@/app/lib/date-utils";

export type ParsedEvent = {
  title: string;
  start: Date;
  end?: Date;
};

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function getNextWeekday(target: number, base: Date) {
  const current = base.getDay();
  const diff = (target + 7 - current) % 7;
  return addDays(base, diff === 0 ? 7 : diff);
}

function parseExplicitDate(input: string, baseYear: number) {
  const monthRegex = /(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)/i;
  const dateRegex = new RegExp(`${monthRegex.source}\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?`, "i");
  const match = input.match(dateRegex);
  if (!match) return null;
  const monthName = match[0].match(monthRegex)?.[0].toLowerCase();
  if (!monthName) return null;
  const day = parseInt(match[1] ?? "1", 10);
  const year = match[2] ? parseInt(match[2], 10) : baseYear;
  const monthIndex = MONTHS.findIndex((m) => m.startsWith(monthName.slice(0, 3)));
  if (monthIndex < 0) return null;
  return new Date(year, monthIndex, day);
}

function extractTitle(input: string) {
  const separators = [" at ", " on ", " tomorrow", " today", " next "];
  for (const sep of separators) {
    const idx = input.toLowerCase().indexOf(sep.trim());
    if (idx > 0) return input.slice(0, idx).trim();
  }
  return input.trim();
}

export function parseNaturalEvent(text: string, baseDate = new Date()): ParsedEvent | null {
  const input = text.trim();
  if (!input) return null;
  const lower = input.toLowerCase();
  let eventDate: Date | null = null;

  if (lower.includes("today")) {
    eventDate = startOfDay(baseDate);
  } else if (lower.includes("tomorrow")) {
    eventDate = startOfDay(addDays(baseDate, 1));
  }

  if (!eventDate) {
    const weekday = WEEKDAYS.findIndex((day) => lower.includes(day));
    if (weekday >= 0) {
      eventDate = startOfDay(getNextWeekday(weekday, baseDate));
    }
  }

  if (!eventDate) {
    const explicit = parseExplicitDate(lower, baseDate.getFullYear());
    if (explicit) eventDate = startOfDay(explicit);
  }

  if (!eventDate) {
    eventDate = startOfDay(baseDate);
  }

  const rangeRegex = /(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\s?(?:-|to|–)\s?(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)/i;
  const rangeMatch = lower.match(rangeRegex);
  const startTimeText = rangeMatch?.[1];
  const endTimeText = rangeMatch?.[2];

  const singleTimeMatch = lower.match(/(\d{1,2}(?::\d{2})?\s?(am|pm))/i);

  const defaultDateTime = new Date(eventDate);
  defaultDateTime.setHours(9, 0, 0, 0);

  let startDate = defaultDateTime;
  let endDate: Date | undefined;

  if (startTimeText) {
    const parsedStart = parseTimeText(startTimeText);
    if (parsedStart) {
      startDate = new Date(eventDate);
      startDate.setHours(parsedStart.hours, parsedStart.minutes, 0, 0);
    }
    const parsedEnd = endTimeText ? parseTimeText(endTimeText) : null;
    if (parsedEnd) {
      endDate = new Date(eventDate);
      endDate.setHours(parsedEnd.hours, parsedEnd.minutes, 0, 0);
    }
  } else if (singleTimeMatch?.[1]) {
    const parsed = parseTimeText(singleTimeMatch[1]);
    if (parsed) {
      startDate = new Date(eventDate);
      startDate.setHours(parsed.hours, parsed.minutes, 0, 0);
    }
  }

  const title = extractTitle(input) || "New event";

  return {
    title,
    start: startDate,
    end: endDate,
  };
}
