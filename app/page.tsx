"use client";

import { useMemo, useState } from "react";

import { TabNavigation, TabDefinition, TabKey } from "@/app/components/tab-navigation";
import { createEventId, useEvents } from "@/app/hooks/use-events";
import {
  formatDate,
  formatTime,
  getMonthMatrix,
  getWeekForDate,
  getYearMonthsMatrix,
  isSameDay,
  startOfDay,
} from "@/app/lib/date-utils";
import { parseNaturalEvent } from "@/app/lib/nlp";
import type { EventInput, EventItem } from "@/app/types/event";
import { ManualEventForm } from "@/app/components/manual-event-form";
import { TasksView } from "@/app/components/tasks-view";

const TABS: TabDefinition[] = [
  { key: "today", label: "Today" },
  { key: "calendar", label: "Calendar" },
  { key: "tasks", label: "Tasks" },
  { key: "settings", label: "Settings" },
];

function HeaderBar({ focusDate }: { focusDate: Date }) {
  return (
    <header className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-200/70">
          📅
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">My personal shiesty planner</p>
          <h1 className="text-2xl font-semibold text-slate-900">Local-first planning assistant</h1>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-md">
        <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
        <span>{formatDate(focusDate, { weekday: "long", month: "long", day: "numeric" })}</span>
      </div>
    </header>
  );
}

function CalendarView({
  viewDate,
  selectedDate,
  events,
  mode,
  onSelectDate,
  onChangeMonth,
  onModeChange,
}: {
  viewDate: Date;
  selectedDate: Date;
  events: EventItem[];
  mode: "month" | "week" | "year";
  onSelectDate: (date: Date) => void;
  onChangeMonth: (direction: -1 | 1, span?: "month" | "year") => void;
  onModeChange: (mode: "month" | "week" | "year") => void;
}) {
  const weeks = useMemo(() => {
    if (mode === "week") return [getWeekForDate(selectedDate)];
    if (mode === "month") return getMonthMatrix(viewDate);
    return [];
  }, [mode, selectedDate, viewDate]);

  const yearMonths = useMemo(() => {
    if (mode !== "year") return [] as Date[][][];
    return getYearMonthsMatrix(viewDate.getFullYear());
  }, [mode, viewDate]);

  const eventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((event) => {
      const key = startOfDay(new Date(event.start)).toISOString();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [events]);

  const handleSelect = (day: Date) => {
    onSelectDate(startOfDay(day));
    if (mode === "year") {
      onModeChange("month");
    }
  };

  const eventsForSelected = events
    .filter((event) => isSameDay(new Date(event.start), selectedDate))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <section className="space-y-4" id="tab-panel-calendar" role="tabpanel" aria-labelledby="tab-calendar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Calendar</p>
          <h2 className="text-2xl font-semibold text-slate-900">
            {mode === "year"
              ? viewDate.getFullYear()
              : formatDate(viewDate, { month: "long", year: "numeric" })}
          </h2>
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
            onClick={() => onModeChange("year")}
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${
              mode === "year" ? "bg-teal-500 text-white" : "bg-white text-slate-700 shadow-sm"
            }`}
          >
            Year
          </button>
          <button
            type="button"
            onClick={() => onChangeMonth(-1, mode === "year" ? "year" : "month")}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-teal-200 hover:text-teal-700"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => onChangeMonth(1, mode === "year" ? "year" : "month")}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-teal-200 hover:text-teal-700"
          >
            Next
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

      {mode !== "year" ? (
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
                const count = eventCounts.get(startOfDay(day).toISOString()) ?? 0;
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleSelect(day)}
                    className={`relative flex h-16 flex-col items-center justify-center rounded-xl border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 ${
                      isSelected
                        ? "border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-800 shadow"
                        : "border-gray-200 bg-white text-slate-700 hover:border-teal-200"
                    }`}
                    aria-current={isToday ? "date" : undefined}
                  >
                    <span className="text-base font-semibold">{day.getDate()}</span>
                    {isToday && <span className="text-[10px] font-semibold text-teal-600">Today</span>}
                    {count > 0 && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                        ● {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {yearMonths.map((monthWeeks, monthIndex) => {
            const monthDate = new Date(viewDate.getFullYear(), monthIndex, 1);
            return (
              <div key={monthIndex} className="space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {formatDate(monthDate, { month: "long", year: "numeric" })}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">{monthDate.getFullYear()}</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[11px] text-slate-500">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                    <div key={label} className="text-center uppercase">
                      {label[0]}
                    </div>
                  ))}
                  {monthWeeks.map((week, idx) => (
                    <div key={idx} className="contents">
                      {week.map((day) => {
                        const isCurrentMonth = day.getMonth() === monthIndex;
                        const isToday = isSameDay(day, new Date());
                        const isSelected = isSameDay(day, selectedDate);
                        const count = eventCounts.get(startOfDay(day).toISOString()) ?? 0;
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => handleSelect(day)}
                            className={`flex h-10 flex-col items-center justify-center rounded-lg border text-[11px] transition ${
                              isSelected
                                ? "border-teal-500 bg-emerald-50 text-teal-800 shadow"
                                : isCurrentMonth
                                  ? "border-gray-200 bg-white text-slate-700 hover:border-teal-200"
                                  : "border-transparent bg-slate-50 text-slate-400"
                            }`}
                            aria-current={isToday ? "date" : undefined}
                          >
                            <span className="font-semibold">{day.getDate()}</span>
                            {count > 0 && <span className="text-[9px] text-purple-600">● {count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <h3 className="text-sm font-semibold text-slate-800">
          Events on {formatDate(selectedDate, { weekday: "long", month: "short", day: "numeric" })}
        </h3>
        {eventsForSelected.length === 0 ? (
          <p className="text-sm text-slate-500">No events yet for this day.</p>
        ) : (
          <div className="space-y-2">
            {eventsForSelected.map((event) => (
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

function TodayPlaceholder({ todayEvents }: { todayEvents: EventItem[] }) {
  return (
    <section className="space-y-4" id="tab-panel-today" role="tabpanel" aria-labelledby="tab-today">
      <div className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Today</p>
            <h2 className="text-2xl font-semibold text-slate-900">Quick glance</h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {todayEvents.length} event{todayEvents.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {todayEvents.length === 0 && <p className="text-sm text-slate-500">Nothing scheduled yet. Try adding one from the chat bar below.</p>}
          {todayEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-slate-50 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                <p className="text-xs text-slate-600">{formatTime(new Date(event.start))}</p>
              </div>
              <span className="text-xs text-slate-500">{formatDate(new Date(event.start), { weekday: "short" })}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlaceholderCard({ title, description, panelId }: { title: string; description: string; panelId: string }) {
  return (
    <section className="space-y-3" id={`tab-panel-${panelId}`} role="tabpanel" aria-labelledby={`tab-${panelId}`}>
      <div className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <p className="text-sm uppercase tracking-[0.16em] text-slate-400">{title}</p>
        <h2 className="text-xl font-semibold text-slate-900">Coming soon</h2>
        <p className="text-sm text-slate-600">{description}</p>
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
              {msg.text}
            </div>
          ))}
        </div>
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
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("calendar");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [viewDate, setViewDate] = useState(startOfDay(new Date()));
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "year">("month");
  const [messages, setMessages] = useState<{ id: string; role: "system" | "user"; text: string }[]>([
    {
      id: "welcome",
      role: "system",
      text: "Type natural language to add events (e.g. ‘project due tomorrow at 3pm’).",
    },
  ]);

  const { events, addEvent, addEvents } = useEvents();

  const todayEvents = useMemo(
    () => events.filter((event) => isSameDay(new Date(event.start), startOfDay(new Date()))),
    [events],
  );

  const handleSelectDate = (date: Date) => {
    setSelectedDate(startOfDay(date));
    setViewDate(startOfDay(date));
  };

  const handleChangeMonth = (direction: -1 | 1, span: "month" | "year" = "month") => {
    const next = new Date(viewDate);
    if (span === "year") {
      next.setFullYear(viewDate.getFullYear() + direction);
    } else {
      next.setMonth(viewDate.getMonth() + direction);
    }
    setViewDate(startOfDay(next));
  };

  const handleNaturalSubmit = (value: string) => {
    const parsed = parseNaturalEvent(value, selectedDate);
    if (!parsed || parsed.events.length === 0) {
      setMessages((prev) => [
        ...prev,
        { id: createEventId(), role: "user", text: value },
        { id: createEventId(), role: "system", text: "I couldn’t understand that. Try ‘math test at 7 pm Thursday’." },
      ]);
      return;
    }

    const inputs: EventInput[] = parsed.events.map((event) => ({
      title: event.title,
      start: event.start.toISOString(),
      end: event.end?.toISOString(),
      notes: event.notes,
      category: "Personal",
    }));

    if (inputs.length === 1) {
      addEvent(inputs[0]);
    } else {
      addEvents(inputs);
    }

    const first = parsed.events[0];
    const addedText =
      inputs.length === 1
        ? `Added: ${first.title} on ${formatDate(first.start, { weekday: "short", month: "short", day: "numeric" })} at ${formatTime(first.start)}.`
        : `Added ${inputs.length} events starting ${formatDate(first.start, { month: "short", day: "numeric" })}.`;

    setMessages((prev) => [
      ...prev,
      { id: createEventId(), role: "user", text: value },
      { id: createEventId(), role: "system", text: addedText },
    ]);
    setSelectedDate(startOfDay(first.start));
    setViewDate(startOfDay(first.start));
    setActiveTab("calendar");
  };

  const handleManualAdd = (input: EventInput) => {
    addEvent(input);
    const target = startOfDay(new Date(input.start));
    setSelectedDate(target);
    setViewDate(target);
    setActiveTab("calendar");
  };

  return (
    <div className="min-h-screen bg-gray-100 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-24 pt-6">
        <HeaderBar focusDate={selectedDate} />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md shadow-slate-200/70">
          <TabNavigation tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />

          <main className="space-y-6 p-4 sm:p-6" aria-live="polite">
            {activeTab === "today" && <TodayPlaceholder todayEvents={todayEvents} />}
            {activeTab === "calendar" && (
              <CalendarView
                viewDate={viewDate}
                selectedDate={selectedDate}
                events={events}
                mode={calendarMode}
                onSelectDate={handleSelectDate}
                onChangeMonth={handleChangeMonth}
                onModeChange={setCalendarMode}
              />
            )}
            {activeTab === "tasks" && (
              <TasksView />
            )}
            {activeTab === "settings" && (
              <PlaceholderCard
                title="Settings"
                description="Notification toggles, export/import, and PWA install tips will show up here soon."
                panelId="settings"
              />
            )}
          </main>
        </div>

        <ManualEventForm
          selectedDate={selectedDate}
          onAdd={handleManualAdd}
          onDateChange={(date) => handleSelectDate(startOfDay(date))}
        />

        <ChatInput onSubmit={handleNaturalSubmit} messages={messages} />
      </div>
    </div>
  );
}
