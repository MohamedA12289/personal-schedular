import {
  addDays,
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
  { regex: /\b(this afternoon|after lunch)\b/i, hour: 13 },
  { regex: /\b(this evening|tonight|tonite|tnite)\b/i, hour: 19 },
  { regex: /\blater today\b/i, hour: 17 },
];

const MONTH_PATTERN =
  "(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)";

const TIME_PATTERN = "(?:\\d{1,2}(?::\\d{2})?\\s?(?:am|pm|a|p)?|noon|midnight|after lunch)";

function sanitizeToken(token: string) {
  return token.toLowerCase().replace(/[^a-z0-9]/gi, "");
}

/**
 * LOCAL date builder (prevents UTC drift)
 * - if year missing, uses reference year, but if that date is already past (by day), bumps to next year
 */
function buildLocalDateWithYearFallback(monthIndex: number, day: number, reference: Date, explicitYear?: number) {
  const ref = startOfDay(reference);
  const year = explicitYear ?? ref.getFullYear();

  const candidate = new Date(year, monthIndex, day, 0, 0, 0, 0);

  if (explicitYear) return candidate;

  // If candidate is same/before today, push to next year (so "Dec 1" in Jan => next Dec 1)
  if (startOfDay(candidate).getTime() <= ref.getTime()) {
    return new Date(year + 1, monthIndex, day, 0, 0, 0, 0);
  }
  return candidate;
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
  const dateRegex = new RegExp(
    `(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?`,
    "i",
  );
  const match = input.match(dateRegex);
  if (!match) return null;

  const monthIndex = getMonthIndex(sanitizeToken(match[1] ?? ""));
  if (monthIndex === undefined) return null;

  const day = parseInt(match[2] ?? "1", 10);
  const explicitYear = match[3] ? parseInt(match[3], 10) : undefined;

  return buildLocalDateWithYearFallback(monthIndex, day, reference, explicitYear);
}

function parseOrdinalDate(lower: string, base: Date) {
  const match = lower.match(/\bon\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const candidate = new Date(base.getFullYear(), base.getMonth(), day, 0, 0, 0, 0);

  if (startOfDay(candidate).getTime() <= startOfDay(base).getTime()) {
    return new Date(base.getFullYear(), base.getMonth() + 1, day, 0, 0, 0, 0);
  }
  return candidate;
}

function getWeekendDate(base: Date) {
  const weekStart = startOfWeek(base);
  let saturday = addDays(weekStart, 6);
  if (saturday <= base) saturday = addDays(saturday, 7);
  return saturday;
}

function parseDateRange(lower: string, reference: Date) {
  const dateRangeRegex = new RegExp(
    `from\\s+(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\s+(?:to|-)\\s+(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?`,
    "i",
  );
  const match = lower.match(dateRangeRegex);
  if (!match) return null;

  // groups:
  // 1=startMonth,2=startDay,3=startYear?,4=endMonth,5=endDay,6=endYear?
  const startMonth = getMonthIndex(sanitizeToken(match[1] ?? ""));
  const endMonth = getMonthIndex(sanitizeToken(match[4] ?? ""));
  if (startMonth === undefined || endMonth === undefined) return null;

  const startDay = parseInt(match[2] ?? "1", 10);
  const endDay = parseInt(match[5] ?? "1", 10);
  const startYear = match[3] ? parseInt(match[3], 10) : undefined;
  const endYear = match[6] ? parseInt(match[6], 10) : undefined;

  const startDate = buildLocalDateWithYearFallback(startMonth, startDay, reference, startYear);
  let endDate = buildLocalDateWithYearFallback(endMonth, endDay, reference, endYear);

  // If end year not provided and computed end is before start, bump end year
  if (!endYear && startOfDay(endDate).getTime() < startOfDay(startDate).getTime()) {
    endDate = new Date(endDate.getFullYear() + 1, endDate.getMonth(), endDate.getDate(), 0, 0, 0, 0);
  }

  return { startDate, endDate, rawText: match[0] };
}

/** Fixes “4p”, “4 p”, “4a”, etc to proper parseTimeText inputs */
function normalizeTimeToken(token: string) {
  let t = token.trim().toLowerCase();

  if (t === "after lunch") return "1 pm";
  if (t === "noon") return "12 pm";
  if (t === "midnight") return "12 am";

  // turn trailing "a"/"p" into am/pm
  t = t.replace(/\b(\d{1,2}(?::\d{2})?)\s*a\b/, "$1 am");
  t = t.replace(/\b(\d{1,2}(?::\d{2})?)\s*p\b/, "$1 pm");

  // "4p" or "4a"
  t = t.replace(/\b(\d{1,2}(?::\d{2})?)(a)\b/, "$1 am");
  t = t.replace(/\b(\d{1,2}(?::\d{2})?)(p)\b/, "$1 pm");

  // clean extra spaces
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function extractTitle(input: string) {
  const patterns: RegExp[] = [
    /\b(?:today|tonight|tonite|tnite|tomorrow|tommorow|tmrw|tmr|2moro|2morrow|tomorow|tom|tmo)\b/gi,
    /\b(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/gi,
    /\bon\s+(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?\b/gi,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s*\d{4})?\b/gi,
    /\b(?:next week|this weekend|later today|this morning|this afternoon|this evening|tonight)\b/gi,
    new RegExp(
      `\\bfrom\\s+${MONTH_PATTERN}\\s+\\d{1,2}(?:st|nd|rd|th)?\\s+(?:to|-)\\s+${MONTH_PATTERN}\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`,
      "gi",
    ),
    /\bin\s+\d+\s+(?:minutes?|minute|hours?|hour)\b/gi,
    /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?\b/gi,
    new RegExp(`\\b(?:from\\s+)?${TIME_PATTERN}\\s*(?:-|to|–)\\s*${TIME_PATTERN}\\b`, "gi"),
    /\b(?:noon|midnight|after lunch)\b/gi,
    /\b(?:morning|afternoon|evening|night)\b/gi,
  ];

  let cleaned = input;
  for (const pattern of patterns) cleaned = cleaned.replace(pattern, " ");
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
    const isHours = offsetMatch[2].startsWith("hour");
    const minutes = isHours ? amount * 60 : amount;

    offsetStart = new Date(now.getTime() + minutes * 60 * 1000);
    eventDate = startOfDay(offsetStart);
    defaultHour = offsetStart.getHours();
    defaultMinute = offsetStart.getMinutes();
  }

  // Tomorrow variants
  if (!eventDate && TOMORROW_WORDS.some((word) => lower.includes(word))) {
    eventDate = startOfDay(addDays(now, 1));
  }

  // Today
  if (!eventDate && lower.includes("today")) {
    eventDate = startOfDay(now);
  }

  // Preset parts of the day adjust default time
  const preset = RELATIVE_TIME_PRESETS.find((entry) => entry.regex.test(lower));
  if (preset) {
    defaultHour = preset.hour;
    defaultMinute = preset.minute ?? 0;
    if (!eventDate) eventDate = startOfDay(now);
  }

  // This/next weekday
  if (!eventDate) {
    const weekdayMatch = lower.match(
      /\b(this|next)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/,
    );
    if (weekdayMatch) {
      const modifier = (weekdayMatch[1] as "this" | "next" | undefined) ?? "this";
      const weekdayIndex = getWeekdayIndex(weekdayMatch[2]);
      if (weekdayIndex !== undefined) eventDate = startOfDay(getNextWeekday(weekdayIndex, now, modifier));
    }
  }

  // “every Monday”
  if (!eventDate) {
    const everyWeekday = lower.match(
      /\bevery\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/,
    );
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

  // Ordinal “on the 15th”
  if (!eventDate) {
    const ordinal = parseOrdinalDate(lower, now);
    if (ordinal) eventDate = startOfDay(ordinal);
  }

  // next week / this weekend / this week
  if (!eventDate && lower.includes("next week")) eventDate = startOfDay(addDays(now, 7));
  if (!eventDate && lower.includes("this weekend")) eventDate = startOfDay(getWeekendDate(now));
  if (!eventDate && lower.includes("this week")) eventDate = startOfWeek(now);

  // Fallback
  if (!eventDate) eventDate = startOfDay(now);

  // Time range: "from 4 to 6" / "4-6"
  const rangeRegex = new RegExp(`(?:from\\s+)?(${TIME_PATTERN})\\s*(?:-|to|–)\\s*(${TIME_PATTERN})`, "i");
  const rangeMatch = lower.match(rangeRegex);
  const startTimeText = rangeMatch?.[1];
  const endTimeText = rangeMatch?.[2];

  // Single time: "at 4pm"
  const singleTimeMatch = lower.match(new RegExp(`\\b(?:at\\s+)?(${TIME_PATTERN})\\b`, "i"));

  // Start baseline
  let startDate = offsetStart ? new Date(offsetStart) : new Date(eventDate);
  startDate.setHours(defaultHour, defaultMinute, 0, 0);

  let endDate: Date | undefined;

  if (startTimeText) {
    const normalizedStart = normalizeTimeToken(startTimeText);
    const normalizedEnd = endTimeText ? normalizeTimeToken(endTimeText) : undefined;

    // If start missing suffix but end has suffix, borrow it
    const endSuffix = normalizedEnd?.match(/\b(am|pm)\b/i)?.[0];
    const startHasSuffix = /\b(am|pm)\b/i.test(normalizedStart);
    const startForParse = !startHasSuffix && endSuffix ? `${normalizedStart} ${endSuffix}` : normalizedStart;

    const parsedStart = parseTimeText(startForParse);
    if (parsedStart) {
      startDate = new Date(eventDate);
      startDate.setHours(parsedStart.hours, parsedStart.minutes, 0, 0);
    }

    const parsedEnd = normalizedEnd ? parseTimeText(normalizedEnd) : null;
    if (parsedEnd) {
      endDate = new Date(eventDate);
      endDate.setHours(parsedEnd.hours, parsedEnd.minutes, 0, 0);

      // If end <= start, assume it goes later (same day) OR into next half-day
      if (endDate.getTime() <= startDate.getTime()) {
        // add 12 hours as a reasonable interpretation for “4 to 6” where 6 is pm-ish
        endDate = new Date(endDate.getTime() + 12 * 60 * 60 * 1000);
        // still <=? then push 24h
        if (endDate.getTime() <= startDate.getTime()) {
          endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
        }
      }
    }
  } else if (singleTimeMatch?.[1]) {
    const normalizedSingle = normalizeTimeToken(singleTimeMatch[1]);
    const parsed = parseTimeText(normalizedSingle);
    if (parsed) {
      startDate = new Date(eventDate);
      startDate.setHours(parsed.hours, parsed.minutes, 0, 0);
    }
  }

  const title = extractTitle(input) || "New event";

  let finalStart = startDate;
  let finalEnd = endDate;

  // If user provided a date range, anchor the event to range start (but keep time)
  if (dateRange) {
    const rangeStart = startOfDay(dateRange.startDate);
    finalStart = new Date(rangeStart);
    finalStart.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);

    if (endDate) {
      finalEnd = new Date(rangeStart);
      finalEnd.setHours(endDate.getHours(), endDate.getMinutes(), 0, 0);
      if (finalEnd.getTime() <= finalStart.getTime()) {
        finalEnd = new Date(finalEnd.getTime() + 24 * 60 * 60 * 1000);
      }
    } else if (startTimeText) {
      finalEnd = new Date(finalStart.getTime() + 60 * 60 * 1000);
    }
  } else if (!finalEnd && startTimeText) {
    // time range start provided but end missing => default 1 hour
    finalEnd = new Date(finalStart.getTime() + 60 * 60 * 1000);
  }

  return { events: [{ title, start: finalStart, end: finalEnd, notes }] };
}
