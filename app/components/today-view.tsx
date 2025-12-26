"use client";

import { formatDate, formatTime, isSameDay, startOfDay } from "@/app/lib/date-utils";
import type { EventItem } from "@/app/types/event";

type TodayViewProps = {
  today?: Date;
  events: EventItem[];
};

export function TodayView({ today = startOfDay(new Date()), events }: TodayViewProps) {
  const todaysEvents = events
    .filter((event) => isSameDay(new Date(event.start), today))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <section className="space-y-4" aria-label="Today overview">
      <div className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Today</p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {formatDate(today, { weekday: "long", month: "long", day: "numeric" })}
            </h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {todaysEvents.length} event{todaysEvents.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {todaysEvents.length === 0 && (
            <p className="text-sm text-slate-500">Nothing scheduled yet. Try adding one from the chat bar below.</p>
          )}
          {todaysEvents.map((event) => (
            <div key={event.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                <p className="text-xs text-slate-500">{formatTime(new Date(event.start))}</p>
              </div>
              <span className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700">
                {event.category ?? "Personal"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
