"use client";

import { formatDate, formatTime, getRelativeDayLabel, startOfDay } from "@/app/lib/date-utils";
import type { EventItem } from "@/app/types/event";

type TasksViewProps = {
  events: EventItem[];
  startDate?: Date;
  days?: number;
};

export function TasksView({ events, startDate = startOfDay(new Date()), days = 14 }: TasksViewProps) {
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  const upcoming = sorted.filter((event) => {
    const start = new Date(event.start);
    return start >= startDate && start <= endDate;
  });

  const grouped = upcoming.reduce<Record<string, EventItem[]>>((acc, event) => {
    const key = startOfDay(new Date(event.start)).toISOString();
    acc[key] = acc[key] ? [...acc[key], event] : [event];
    return acc;
  }, {});

  const groupEntries = Object.entries(grouped).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <section className="space-y-4" aria-label="Upcoming tasks">
      <div className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Tasks</p>
            <h2 className="text-2xl font-semibold text-slate-900">Next {days} days</h2>
          </div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
            {upcoming.length} item{upcoming.length === 1 ? "" : "s"}
          </span>
        </div>

        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No upcoming tasks in this range.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {groupEntries.map(([dateKey, items]) => {
              const displayDate = new Date(dateKey);
              return (
                <div key={dateKey} className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{getRelativeDayLabel(displayDate)}</p>
                    <span className="text-xs text-slate-500">{formatDate(displayDate, { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((event) => (
                      <div key={event.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                          <p className="text-xs text-slate-500">
                            {formatTime(new Date(event.start))}
                            {event.end ? ` – ${formatTime(new Date(event.end))}` : ""}
                          </p>
                        </div>
                        {event.category && (
                          <span className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700">
                            {event.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
