"use client";

import { useMemo } from "react";

import {
  formatDate,
  formatTime,
  getMonthMatrix,
  getWeekForDate,
  isSameDay,
  startOfDay,
} from "@/app/lib/date-utils";
import type { EventItem } from "@/app/types/event";

export type CalendarMode = "month" | "week";

export type CalendarViewProps = {
  viewDate: Date;
  selectedDate: Date;
  events: EventItem[];
  mode?: CalendarMode;
  weekStartsOn?: number;
  onSelectDate: (date: Date) => void;
  onChangeMonth: (direction: -1 | 1) => void;
  onModeChange: (mode: CalendarMode) => void;
};

export function CalendarView({
  viewDate,
  selectedDate,
  events,
  mode = "month",
  weekStartsOn = 0,
  onSelectDate,
  onChangeMonth,
  onModeChange,
}: CalendarViewProps) {
  const weeks = useMemo(() => {
    if (mode === "week") return [getWeekForDate(selectedDate, weekStartsOn)];
    return getMonthMatrix(viewDate, weekStartsOn);
  }, [mode, selectedDate, viewDate, weekStartsOn]);

  const eventsForSelected = useMemo(
    () =>
      events
        .filter((event) => isSameDay(new Date(event.start), selectedDate))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [events, selectedDate],
  );

  return (
    <section className="space-y-4" aria-label="Calendar view">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Calendar</p>
          <h2 className="text-2xl font-semibold text-slate-900">
            {formatDate(viewDate, { month: "long", year: "numeric" })}
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
            onClick={() => onChangeMonth(-1)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-teal-200 hover:text-teal-700"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => onChangeMonth(1)}
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
        <h3 className="text-sm font-semibold text-slate-800">
          Events on {formatDate(selectedDate, { weekday: "long", month: "short", day: "numeric" })}
        </h3>
        {eventsForSelected.length === 0 ? (
          <p className="text-sm text-slate-500">No events yet for this day.</p>
        ) : (
          <div className="space-y-2">
            {eventsForSelected.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatTime(new Date(event.start))}
                    {event.end ? ` – ${formatTime(new Date(event.end))}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700">
                  {event.category ?? "Personal"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
