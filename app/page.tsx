import Image from "next/image";
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { TabNavigation, TabDefinition, TabKey } from "@/app/components/tab-navigation";
import { useEvents } from "@/app/hooks/use-events";
import {
  formatDate,
  formatTime,
  getMonthMatrix,
  getRelativeDayLabel,
  getWeekForDate,
  isSameDay,
  minutesSinceStartOfDay,
  startOfDay,
} from "@/app/lib/date-utils";
import { parseNaturalEvent } from "@/app/lib/nlp";
import type { EventInput, EventItem } from "@/app/types/event";

const TABS: TabDefinition[] = [
  { key: "calendar", label: "Calendar" },
  { key: "day", label: "Day" },
  { key: "list", label: "List" },
  { key: "settings", label: "Settings" },
];

const HOUR_RANGE = { start: 6, end: 24 };
const REMINDER_OPTIONS = [5, 10, 15, 30, 60];

function HeaderBar({ selectedDate }: { selectedDate: Date }) {
  return (
    <header className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 text-white shadow-lg shadow-emerald-200/70">
          📅
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">My Schedule</p>
          <h1 className="text-2xl font-semibold text-slate-900">PassivePilot-inspired planner</h1>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-md">
        <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
        <span>{formatDate(selectedDate, { weekday: "long", month: "long", day: "numeric" })}</span>
      </div>
    </header>
  );
}

function CalendarView({
  currentDate,
  selectedDate,
  onSelectDate,
  events,
  mode,
  onModeChange,
}: {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: EventItem[];
  mode: "month" | "week";
  onModeChange: (mode: "month" | "week") => void;
}) {
  const weeks = useMemo(() => {
    if (mode === "week") return [getWeekForDate(selectedDate)];
    return getMonthMatrix(currentDate);
  }, [currentDate, mode, selectedDate]);

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Calendar</p>
          <h2 className="text-2xl font-semibold text-slate-900">{formatDate(currentDate, { month: "long", year: "numeric" })}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onModeChange("month")}
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${
              mode === "month" ? "bg-teal-500 text-white" : "bg-white text-slate-700 shadow-sm"
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => onModeChange("week")}
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${
              mode === "week" ? "bg-teal-500 text-white" : "bg-white text-slate-700 shadow-sm"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(startOfDay(new Date()))}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-teal-200 hover:text-teal-700"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div key={label} className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </div>
        ))}
        {weeks.map((week, idx) => (
          <div key={idx} className="contents">
            {week.map((day) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const dayEvents = events.filter((event) => isSameDay(new Date(event.start), day));
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => onSelectDate(startOfDay(day))}
                  className={`relative flex h-16 flex-col items-center justify-center rounded-xl border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 ${
                    isSelected
                      ? "border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-800 shadow"
                      : "border-gray-200 bg-white text-slate-700 hover:border-teal-200"
                  }`}
                  aria-current={isToday ? "date" : undefined}
                >
                  <span className="text-base font-semibold">{day.getDate()}</span>
                  {isToday && <span className="text-[10px] font-semibold text-teal-600">Today</span>}
                  {dayEvents.length > 0 && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                      ● {dayEvents.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <h3 className="text-sm font-semibold text-slate-800">Events on {formatDate(selectedDate, { weekday: "long", month: "short", day: "numeric" })}</h3>
        {events.filter((event) => isSameDay(new Date(event.start), selectedDate)).length === 0 ? (
          <p className="text-sm text-slate-500">No events yet for this day.</p>
        ) : (
          <div className="space-y-2">
            {events
              .filter((event) => isSameDay(new Date(event.start), selectedDate))
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
              .map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                    <p className="text-xs text-slate-500">
                      {formatTime(new Date(event.start))}
                      {event.end ? ` – ${formatTime(new Date(event.end))}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700">{event.category ?? "Personal"}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DayView({
  selectedDate,
  events,
  zoom,
  onZoomChange,
  onUpdateReminder,
}: {
  selectedDate: Date;
  events: EventItem[];
  zoom: "compact" | "normal" | "detailed";
  onZoomChange: (zoom: "compact" | "normal" | "detailed") => void;
  onUpdateReminder: (id: string, reminderMinutesBefore: number) => void;
}) {
  const rowHeight = useMemo(() => {
    if (zoom === "compact") return 28;
    if (zoom === "detailed") return 68;
    return 44;
  }, [zoom]);

  const isToday = isSameDay(selectedDate, new Date());
  const [nowPosition, setNowPosition] = useState(() => {
    const minutes = minutesSinceStartOfDay(new Date());
    return ((minutes - HOUR_RANGE.start * 60) / ((HOUR_RANGE.end - HOUR_RANGE.start) * 60)) * 100;
  });

  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => {
      const minutes = minutesSinceStartOfDay(new Date());
      setNowPosition(((minutes - HOUR_RANGE.start * 60) / ((HOUR_RANGE.end - HOUR_RANGE.start) * 60)) * 100);
    }, 60_000);
    return () => clearInterval(interval);
  }, [isToday]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Day view</p>
          <h2 className="text-2xl font-semibold text-slate-900">{formatDate(selectedDate, { weekday: "long", month: "long", day: "numeric" })}</h2>
        </div>
        <div className="flex gap-2">
          {["compact", "normal", "detailed"].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onZoomChange(level as typeof zoom)}
              className={`rounded-full px-3 py-2 text-sm font-medium capitalize transition ${
                zoom === level ? "bg-purple-500 text-white" : "bg-white text-slate-700 shadow-sm"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="relative">
          {Array.from({ length: HOUR_RANGE.end - HOUR_RANGE.start + 1 }, (_, idx) => idx + HOUR_RANGE.start).map((hour) => (
            <div
              key={hour}
              className="flex items-start gap-3 border-b border-dashed border-slate-200 last:border-0"
              style={{ height: rowHeight }}
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
              <div className="w-12 pt-1 text-right text-xs font-semibold text-slate-400">{hour}:00</div>
              <div className="flex-1" />
            </div>
          ))}

          {events
            .filter((event) => isSameDay(new Date(event.start), selectedDate))
            .map((event) => {
              const start = new Date(event.start);
              const end = event.end ? new Date(event.end) : new Date(start.getTime() + 60 * 60 * 1000);
              const startMinutes = minutesSinceStartOfDay(start) - HOUR_RANGE.start * 60;
              const endMinutes = minutesSinceStartOfDay(end) - HOUR_RANGE.start * 60;
              const totalMinutes = (HOUR_RANGE.end - HOUR_RANGE.start) * 60;
              const top = (startMinutes / totalMinutes) * 100;
              const height = Math.max(12, ((endMinutes - startMinutes) / totalMinutes) * 100);
              return (
                <div
                  key={event.id}
                  className="absolute left-[70px] right-4 rounded-xl border border-teal-200 bg-teal-50/80 p-3 shadow-sm"
                  style={{ top: `${top}%`, height: `${height}%` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-600">
                        {formatTime(start)}
                        {event.end ? ` – ${formatTime(end)}` : ""}
                      </p>
                    </div>
                    <div className="text-xs text-teal-700">{event.category ?? "Personal"}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-purple-700">Reminder</span>
                    <select
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                      value={event.reminderMinutesBefore ?? ""}
                      onChange={(e) => onUpdateReminder(event.id, Number(e.target.value || "10"))}
                    >
                      <option value="">None</option>
                      {REMINDER_OPTIONS.map((option) => (
                        <option key={option} value={option}>{`${option} min`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}

          {isToday && nowPosition > 0 && nowPosition < 100 && (
            <div className="absolute left-0 right-0" style={{ top: `${nowPosition}%` }}>
              <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
                <span className="rounded-full bg-teal-500 px-3 py-1 text-[11px] font-semibold text-white shadow">Now</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EventList({ events }: { events: EventItem[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Upcoming</p>
          <h2 className="text-2xl font-semibold text-slate-900">List</h2>
        </div>
        <div className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">{sorted.length} events</div>
      </div>
      <div className="space-y-2">
        {sorted.map((event) => (
          <div key={event.id} className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{event.title}</p>
              <span className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700">{event.category ?? "Personal"}</span>
            </div>
            <p className="text-xs text-slate-600">
              {formatDate(new Date(event.start), { weekday: "short", month: "short", day: "numeric" })} • {formatTime(new Date(event.start))}
              {event.end ? ` – ${formatTime(new Date(event.end))}` : ""}
            </p>
            {event.notes && <p className="text-sm text-slate-600">{event.notes}</p>}
          </div>
        ))}
        {sorted.length === 0 && <p className="text-sm text-slate-500">No events yet. Try adding one from the chat bar below.</p>}
      </div>
    </section>
  );
}

function ChatInput({
  onSubmit,
  messages,
}: {
  onSubmit: (value: string) => void;
  messages: { id: string; role: "system" | "user"; text: string }[];
}) {
  const [value, setValue] = useState("");
  const handleSend = () => {
    if (!value.trim()) return;
    onSubmit(value);
    setValue("");
  };
  return (
    <div className="sticky bottom-0 mt-6 rounded-2xl bg-white p-4 shadow-lg shadow-slate-300/50">
      <div className="space-y-2">
        <div className="space-y-1">
          {messages.slice(-3).map((msg) => (
            <div
              key={msg.id}
              className={`w-fit max-w-full rounded-2xl px-3 py-2 text-sm shadow-sm ${
                msg.role === "user" ? "ml-auto bg-teal-100 text-teal-900" : "bg-slate-100 text-slate-800"
              }`}
            >
              Learning
            </a>{" "}
            center.
          </p>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 shadow-inner">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="e.g. math test at 7 pm Thursday"
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-teal-600"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  onExport,
  onImport,
  onToggleNotifications,
  notificationsEnabled,
  dataInfo,
}: {
  onExport: () => void;
  onImport: (file: File) => void;
  onToggleNotifications: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  dataInfo: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Settings</p>
        <h2 className="text-2xl font-semibold text-slate-900">Device & sync</h2>
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">Enable notifications</p>
            <p className="text-sm text-slate-600">Works best when the app is open or installed as a PWA.</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={notificationsEnabled}
              onChange={(e) => onToggleNotifications(e.target.checked)}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-teal-500 peer-checked:after:translate-x-full" />
          </label>
        </div>
        <p className="text-xs text-slate-500">Notifications stay local to this device. Reminders fire when the app or installed PWA is active.</p>
      </div>

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">Export data</p>
            <p className="text-sm text-slate-600">Download a JSON backup to move between devices.</p>
          </div>
          <button
            type="button"
            onClick={onExport}
            className="rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-600"
          >
            Documentation
          </a>
            Export
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">Import data</p>
            <p className="text-sm text-slate-600">Replace current events with a saved JSON file.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-teal-200"
            >
              Import
            </button>
          </div>
        </div>
      </main>
        <p className="text-xs text-slate-500">{dataInfo}</p>
      </div>

      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <p className="font-semibold text-slate-900">Install as an app</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>On iPhone, open in Safari and choose “Add to Home Screen”.</li>
          <li>On desktop browsers, use the Install option in the address bar.</li>
          <li>Everything works offline with local data; sync is manual via export/import.</li>
        </ul>
      </div>
    </section>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("calendar");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [calendarView, setCalendarView] = useState<"month" | "week">("month");
  const [dayZoom, setDayZoom] = useState<"compact" | "normal" | "detailed">("normal");
  const [messages, setMessages] = useState<{ id: string; role: "system" | "user"; text: string }[]>([
    {
      id: "welcome",
      role: "system",
      text: "Type natural language to add events (e.g. ‘project due tomorrow at 3pm’).",
    },
  ]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("my-schedule-notifications") === "true";
  });
  const notificationTimers = useRef<NodeJS.Timeout[]>([]);

  const { events, addEvent, updateEvent } = useEvents();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("my-schedule-notifications", String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (navigator.serviceWorker) {
      navigator.serviceWorker.register("/sw.js").catch((error) => console.error("SW registration failed", error));
    }
  }, []);

  useEffect(() => {
    notificationTimers.current.forEach((timer) => clearTimeout(timer));
    notificationTimers.current = [];
    if (!notificationsEnabled || typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (Notification.permission !== "granted") return;

    const now = Date.now();
    events.forEach((event) => {
      if (!event.reminderMinutesBefore) return;
      const reminderTime = new Date(event.start).getTime() - event.reminderMinutesBefore * 60 * 1000;
      const delay = reminderTime - now;
      if (delay <= 0 || delay > 1000 * 60 * 60 * 24 * 3) return;
      const timer = setTimeout(() => {
        new Notification(event.title, {
          body: `${formatDate(new Date(event.start), { weekday: "short", month: "short", day: "numeric" })} at ${formatTime(new Date(event.start))}`,
          icon: "/icon-192.svg",
        });
      }, delay);
      notificationTimers.current.push(timer);
    });
  }, [events, notificationsEnabled]);

  const selectedEvents = useMemo(
    () => events.filter((event) => isSameDay(new Date(event.start), selectedDate)),
    [events, selectedDate],
  );

  const handleNaturalSubmit = (value: string) => {
    const parsed = parseNaturalEvent(value, selectedDate);
    if (!parsed) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "system", text: "I couldn’t understand that. Try ‘math test at 7 pm Thursday’." }]);
      return;
    }
    const event: EventInput = {
      title: parsed.title,
      start: parsed.start.toISOString(),
      end: parsed.end?.toISOString(),
      category: "Personal",
      reminderMinutesBefore: 10,
    };
    addEvent(event);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: value },
      {
        id: crypto.randomUUID(),
        role: "system",
        text: `Added: ${parsed.title} on ${formatDate(parsed.start, { weekday: "short", month: "short", day: "numeric" })} at ${formatTime(parsed.start)}.`,
      },
    ]);
    setSelectedDate(startOfDay(parsed.start));
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      events,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `my-schedule-backup-${formatDate(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" })}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    try {
      const data = JSON.parse(text) as { events?: EventItem[] };
      if (Array.isArray(data.events)) {
        window.localStorage.setItem("my-schedule-events", JSON.stringify(data.events));
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to import", error);
    }
  };

  const dataInfo = `Export creates a JSON backup you can move to another device and Import replaces current data. Last saved ${events.length} events locally.`;

  return (
    <div className="min-h-screen bg-gray-100 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-24 pt-6">
        <HeaderBar selectedDate={selectedDate} />

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="hidden rounded-2xl bg-slate-900 p-4 text-slate-100 shadow-lg lg:block">
            <div className="space-y-3">
              <div className="rounded-xl bg-white/10 p-3 text-sm text-slate-100">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-200">Quick filter</p>
                <p className="text-base font-semibold">{formatDate(selectedDate, { weekday: "long", month: "short", day: "numeric" })}</p>
                <p className="text-sm text-emerald-100">{selectedEvents.length} events</p>
              </div>
              <div className="space-y-2">
                {getWeekForDate(selectedDate).map((date) => (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(startOfDay(date))}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      isSameDay(date, selectedDate) ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <span>{formatDate(date, { weekday: "short", day: "numeric" })}</span>
                    <span className="text-xs text-emerald-100">{getRelativeDayLabel(date)}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md shadow-slate-200/70">
            <TabNavigation tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />

            <main className="space-y-6 p-4 sm:p-6" aria-live="polite">
              {activeTab === "calendar" && (
                <CalendarView
                  currentDate={selectedDate}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  events={events}
                  mode={calendarView}
                  onModeChange={setCalendarView}
                />
              )}
              {activeTab === "day" && (
                <DayView
                  selectedDate={selectedDate}
                  events={events}
                  zoom={dayZoom}
                  onZoomChange={setDayZoom}
                  onUpdateReminder={(id, reminderMinutesBefore) => updateEvent(id, { reminderMinutesBefore })}
                />
              )}
              {activeTab === "list" && <EventList events={events} />}
              {activeTab === "settings" && (
                <SettingsPanel
                  onExport={handleExport}
                  onImport={handleImport}
                  onToggleNotifications={setNotificationsEnabled}
                  notificationsEnabled={notificationsEnabled}
                  dataInfo={dataInfo}
                />
              )}
            </main>
          </div>
        </div>

        <ChatInput onSubmit={handleNaturalSubmit} messages={messages} />
      </div>
    </div>
  );
}