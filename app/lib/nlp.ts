import {
  addDays,
  buildDateWithYearFallback,
  getMonthIndex,
  getWeekdayIndex,
  parseTimeText,
  startOfDay,
  startOfWeek,
} from "@/app/lib/date-utils";

export type ParsedEvent = {
  title: string;
  start: Date;
  end?: Date;
  notes?: string;
};

export type ParsedResult = { events: ParsedEvent[] };

const TOMORROW_WORDS = ["tomorrow", "tommorow", "tmrw", "tmr", "2moro", "2morrow", "tomorow", "tom", "tmo"];
const RELATIVE_TIME_PRESETS: { regex: RegExp; hour: number; minute?: number }[] = [
  { regex: /\bthis morning\b/i, hour: 9 },
  // “after lunch” is interpreted as early afternoon by convention.
  { regex: /\b(this afternoon|after lunch)\b/i, hour: 13 },
  { regex: /\b(this evening|tonight|tonite|tnite)\b/i, hour: 19 },
  { regex: /\blater today\b/i, hour: 17 },
];

const MONTH_PATTERN = "(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)";
const TIME_PATTERN = "(?:\\d{1,2}(?::\\d{2})?\\s?(?:am|pm|a|p)?|noon|midnight|after lunch)";

function sanitizeToken(token: string) {
  return token.toLowerCase().replace(/[^a-z0-9]/gi, "");
}

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

function parseExplicitDate(input: string, reference: Date) {
  const dateRegex = new RegExp(`(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?`, "i");
  const match = input.match(dateRegex);
  if (!match) return null;
  const monthIndex = getMonthIndex(sanitizeToken(match[1] ?? ""));
  if (monthIndex === undefined) return null;
  const day = parseInt(match[2] ?? "1", 10);
  const explicitYear = match[3] ? parseInt(match[3], 10) : undefined;
  return buildDateWithYearFallback(monthIndex, day, reference, explicitYear);
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

function parseDateRange(lower: string, reference: Date) {
  const dateRangeRegex = new RegExp(
    `from\\s+(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\s+(?:to|-)\\s+(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?`,
    "i",
  );
  const match = lower.match(dateRangeRegex);
  if (!match) return null;

  const startMonth = getMonthIndex(sanitizeToken(match[1] ?? ""));
  const endMonth = getMonthIndex(sanitizeToken(match[3] ?? ""));
  if (startMonth === undefined || endMonth === undefined) return null;

  const startDay = parseInt(match[2] ?? "1", 10);
  const endDay = parseInt(match[4] ?? "1", 10);
  const startYear = match[5] ? parseInt(match[5], 10) : undefined;
  const endYear = match[6] ? parseInt(match[6], 10) : undefined;

  const startDate = buildDateWithYearFallback(startMonth, startDay, reference, startYear);
  let endDate = buildDateWithYearFallback(endMonth, endDay, reference, endYear);
  if (!endYear && startDate > endDate) {
    endDate = buildDateWithYearFallback(endMonth, endDay, addDays(reference, 365));
  }

  return { startDate, endDate, rawText: match[0] };
}

function extractTitle(input: string) {
  const patterns: RegExp[] = [
    /\b(?:today|tonight|tonite|tnite|tomorrow|tommorow|tmrw|tmr|2moro|2morrow|tomorow|tom|tmo)\b/gi,
    /\b(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/gi,
    /\bon\s+(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?\b/gi,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s*\d{4})?\b/gi,
    /\b(?:next week|this weekend|later today|this morning|this afternoon|this evening|tonight)\b/gi,
    new RegExp(`\\bfrom\\s+${MONTH_PATTERN}\\s+\\d{1,2}(?:st|nd|rd|th)?\\s+(?:to|-)\\s+${MONTH_PATTERN}\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`, "gi"),
    /\bin\s+\d+\s+(?:minutes?|minute|hours?|hour)\b/gi,
    /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?\b/gi,
    new RegExp(`\\b(?:from\\s+)?${TIME_PATTERN}\\s*(?:-|to|–)\\s*${TIME_PATTERN}\\b`, "gi"),
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

export function parseNaturalEvent(text: string, baseDate = new Date()): ParsedResult | null {
  const input = text.trim();
  if (!input) return null;
  const lower = input.toLowerCase();

  const now = baseDate;
  const dateRange = parseDateRange(lower, baseDate);
  const rangeNote = dateRange ? `Requested range: ${dateRange.rawText.trim()}` : undefined;

  let eventDate: Date | null = dateRange?.startDate ? startOfDay(dateRange.startDate) : null;
  let defaultHour = 9;
  let defaultMinute = 0;
  let notes: string | undefined = rangeNote;

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

  // This/next weekday (full or abbreviated)
  if (!eventDate) {
    const weekdayMatch = lower.match(/\b(this|next)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/);
    if (weekdayMatch) {
      const modifier = (weekdayMatch[1] as "this" | "next" | undefined) ?? "this";
      const weekdayIndex = getWeekdayIndex(weekdayMatch[2]);
      if (weekdayIndex !== undefined) {
        eventDate = startOfDay(getNextWeekday(weekdayIndex, now, modifier));
      }
    }
  }

  // Simple “every Monday” style repetitions are captured as a note for now
  if (!eventDate) {
    const everyWeekday = lower.match(/\bevery\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/);
    if (everyWeekday) {
      const weekdayIndex = getWeekdayIndex(everyWeekday[1]);
      if (weekdayIndex !== undefined) {
        eventDate = startOfDay(getNextWeekday(weekdayIndex, now, "this"));
        notes = notes ?? `Repeats every ${everyWeekday[1]}`;
      }
    }
  }

  // Explicit month names
  if (!eventDate) {
    const explicit = parseExplicitDate(lower, now);
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
  if (!eventDate && lower.includes("this week")) {
    eventDate = startOfWeek(now);
  }

  // Fallback to today if nothing else matched
  if (!eventDate) {
    eventDate = startOfDay(now);
  }

  const rangeRegex = new RegExp(`(?:from\\s+)?(${TIME_PATTERN})\\s*(?:-|to|–)\\s*(${TIME_PATTERN})`, "i");
  const rangeMatch = lower.match(rangeRegex);
  const startTimeText = rangeMatch?.[1];
  const endTimeText = rangeMatch?.[2];

  const singleTimeMatch = lower.match(new RegExp(`\\b(?:at\\s+)?(${TIME_PATTERN})\\b`, "i"));

  let startDate = offsetStart ?? new Date(eventDate);
  startDate.setHours(defaultHour, defaultMinute, 0, 0);
  let endDate: Date | undefined;

  if (startTimeText) {
    const startSuffix = endTimeText?.match(/(am|pm|a|p)/i)?.[0];
    const normalizedStartText = !/(am|pm|a|p)/i.test(startTimeText) && startSuffix
      ? `${startTimeText} ${startSuffix}`
      : startTimeText;

    const parsedStart = parseTimeText(normalizedStartText);
    if (parsedStart) {
      startDate = new Date(eventDate);
      startDate.setHours(parsedStart.hours, parsedStart.minutes, 0, 0);
    }
    const parsedEnd = endTimeText ? parseTimeText(endTimeText) : null;
    if (parsedEnd) {
      const endHasSuffix = endTimeText ? /(am|pm|a|p)/i.test(endTimeText) : false;
      if (!endHasSuffix && parsedStart && parsedStart.hours >= parsedEnd.hours) {
        parsedEnd.hours = (parsedEnd.hours + 12) % 24;
      }
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

  let finalStart = startDate;
  let finalEnd = endDate;

  if (dateRange) {
    const rangeStart = startOfDay(dateRange.startDate);
    finalStart = new Date(rangeStart);
    finalStart.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);

    if (endDate) {
      finalEnd = new Date(rangeStart);
      finalEnd.setHours(endDate.getHours(), endDate.getMinutes(), 0, 0);
    } else if (startTimeText) {
      finalEnd = new Date(finalStart.getTime() + 60 * 60 * 1000);
    }
  } else if (!finalEnd && startTimeText) {
    finalEnd = new Date(finalStart.getTime() + 60 * 60 * 1000);
  }

  const events: ParsedEvent[] = [{ title, start: finalStart, end: finalEnd, notes }];

  // Examples (documentation only):
  // - "tmrw at 7 pm homework" => tomorrow 19:00
  // - "2moro 3pm dentist" => tomorrow 15:00
  // - "this evening gym" => today 19:00
  // - "next Friday at noon project review" => next Friday 12:00
  // - "in 2 hours file taxes" => base date +2h
  // - "math class from 4 to 6 from december 25 to february 24" => single event on Dec 25 with range noted

  return { events };
}