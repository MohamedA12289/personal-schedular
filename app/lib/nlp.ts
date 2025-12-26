import { addDays, parseTimeText, startOfDay, startOfWeek } from "@/app/lib/date-utils";

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

const TOMORROW_WORDS = ["tomorrow", "tmrw", "tmr", "2moro", "2morrow", "tomorow"];
const RELATIVE_TIME_PRESETS: { regex: RegExp; hour: number; minute?: number }[] = [
  { regex: /\bthis morning\b/i, hour: 9 },
  { regex: /\b(this afternoon|after lunch)\b/i, hour: 13 },
  { regex: /\b(this evening|tonight)\b/i, hour: 19 },
  { regex: /\blater today\b/i, hour: 17 },
];

function getNextWeekday(target: number, base: Date, mode: "this" | "next" = "this") {
  const weekStart = startOfWeek(base);
  let candidate = addDays(weekStart, target);
  if (mode === "next") {
    candidate = addDays(candidate, 7);
  } else if (candidate < base) {
    candidate = addDays(candidate, 7);
  }
  return candidate;
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

function parseOrdinalDate(lower: string, base: Date) {
  const match = lower.match(/\bon\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const candidate = new Date(base.getFullYear(), base.getMonth(), day);
  if (startOfDay(candidate) <= startOfDay(base)) {
    return new Date(base.getFullYear(), base.getMonth() + 1, day);
  }
  return candidate;
}

function getWeekendDate(base: Date) {
  const weekStart = startOfWeek(base);
  let saturday = addDays(weekStart, 6);
  if (saturday <= base) {
    saturday = addDays(saturday, 7);
  }
  return saturday;
}

function extractTitle(input: string) {
  const patterns: RegExp[] = [
    /\b(?:today|tonight|tomorrow|tmrw|tmr|2moro|2morrow|tomorow)\b/gi,
    /\b(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\bon\s+(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?\b/gi,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s*\d{4})?\b/gi,
    /\b(?:next week|this weekend|later today|this morning|this afternoon|this evening)\b/gi,
    /\bin\s+\d+\s+(?:minutes?|minute|hours?|hour)\b/gi,
    /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?\b/gi,
    /\b(?:noon|midnight|after lunch)\b/gi,
    /\b(?:morning|afternoon|evening|night)\b/gi,
  ];

  let cleaned = input;
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, " ");
  }

  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned || input.trim();
}

export function parseNaturalEvent(text: string, baseDate = new Date()): ParsedEvent | null {
  const input = text.trim();
  if (!input) return null;
  const lower = input.toLowerCase();

  const now = baseDate;
  let eventDate: Date | null = null;
  let defaultHour = 9;
  let defaultMinute = 0;

  // Relative offsets like "in 45 minutes" or "in 2 hours"
  const offsetMatch = lower.match(/\bin\s+(\d+)\s+(minutes?|minute|hours?|hour)\b/);
  let offsetStart: Date | null = null;
  if (offsetMatch) {
    const amount = parseInt(offsetMatch[1], 10);
    const unit = offsetMatch[2].startsWith("hour") ? 60 : 1;
    offsetStart = new Date(now.getTime() + amount * unit * 60 * 1000);
    eventDate = startOfDay(offsetStart);
    defaultHour = offsetStart.getHours();
    defaultMinute = offsetStart.getMinutes();
  }

  // Tomorrow and friendly variants
  if (!eventDate && TOMORROW_WORDS.some((word) => lower.includes(word))) {
    eventDate = startOfDay(addDays(now, 1));
  }

  // Today and relative parts of today
  if (!eventDate && lower.includes("today")) {
    eventDate = startOfDay(now);
  }

  // Preset parts of the day adjust default time
  const preset = RELATIVE_TIME_PRESETS.find((entry) => entry.regex.test(lower));
  if (preset) {
    defaultHour = preset.hour;
    defaultMinute = preset.minute ?? 0;
    if (!eventDate) {
      eventDate = startOfDay(now);
    }
  }

  // This/next weekday
  if (!eventDate) {
    const weekdayMatch = lower.match(/\b(this|next)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
    if (weekdayMatch) {
      const modifier = (weekdayMatch[1] as "this" | "next" | undefined) ?? "this";
      const weekdayIndex = WEEKDAYS.findIndex((day) => day === weekdayMatch[2]);
      if (weekdayIndex >= 0) {
        eventDate = startOfDay(getNextWeekday(weekdayIndex, now, modifier));
      }
    }
  }

  // Explicit month names
  if (!eventDate) {
    const explicit = parseExplicitDate(lower, now.getFullYear());
    if (explicit) eventDate = startOfDay(explicit);
  }

  // Ordinal dates like "on the 15th"
  if (!eventDate) {
    const ordinal = parseOrdinalDate(lower, now);
    if (ordinal) eventDate = startOfDay(ordinal);
  }

  // "next week" / "this weekend"
  if (!eventDate && lower.includes("next week")) {
    eventDate = startOfDay(addDays(now, 7));
  }
  if (!eventDate && lower.includes("this weekend")) {
    eventDate = startOfDay(getWeekendDate(now));
  }

  // Fallback to today if nothing else matched
  if (!eventDate) {
    eventDate = startOfDay(now);
  }

  const rangeRegex = /(\d{1,2}(?::\d{2})?\s?(?:am|pm|a|p)?|noon|midnight|after lunch)\s?(?:-|to|–)\s?(\d{1,2}(?::\d{2})?\s?(?:am|pm|a|p)?)/i;
  const rangeMatch = lower.match(rangeRegex);
  const startTimeText = rangeMatch?.[1];
  const endTimeText = rangeMatch?.[2];

  const singleTimeMatch = lower.match(/\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s?(?:am|pm|a|p)?|noon|midnight|after lunch)\b/i);

  let startDate = offsetStart ?? new Date(eventDate);
  startDate.setHours(defaultHour, defaultMinute, 0, 0);
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

  // Examples (documentation only):
  // - "tmrw at 7 pm homework" => tomorrow 19:00
  // - "2moro 3pm dentist" => tomorrow 15:00
  // - "this evening gym" => today 19:00
  // - "next Friday at noon project review" => next Friday 12:00
  // - "in 2 hours file taxes" => base date +2h

  return {
    title,
    start: startDate,
    end: endDate,
  };
}