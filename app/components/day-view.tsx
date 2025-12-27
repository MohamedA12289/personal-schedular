"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDate, formatTime, isSameDay, minutesSinceStartOfDay } from "@/app/lib/date-utils";
import type { EventItem } from "@/app/types/event";

type ZoomLevel = "compact" | "normal" | "detailed";

const ZOOM_HEIGHTS: Record<ZoomLevel, number> = {
  compact: 24,
  normal: 40,
  detailed: 64,
};

type DayViewProps = {
  date: Date;
  events: EventItem[];
  zoom?: ZoomLevel;
  onZoomChange?: (zoom: ZoomLevel) => void;
};

export function DayView({ date, events, zoom = "normal", onZoomChange }: DayViewProps) {
  const [nowPosition, setNowPosition] = useState<number | null>(null);
  const hourHeight = ZOOM_HEIGHTS[zoom];

  useEffect(() => {
    function updateNow() {
      if (!isSameDay(date, new Date())) {
        setNowPosition(null);
        return;
      }
      const minutes = minutesSinceStartOfDay(new Date());
      setNowPosition(minutes * (hourHeight / 60));
    }

    updateNow();
    const timer = setInterval(updateNow, 60 * 1000);
    return () => clearInterval(timer);
  }, [date, hourHeight]);

  const dayEvents = useMemo(
    () =>
      events
        .filter((event) => isSameDay(new Date(event.start), date))
        .map((event) => {
          const start = new Date(event.start);
          const end = event.end ? new Date(event.end) : new Date(start.getTime() + 60 * 60 * 1000);
          const startMinutes = minutesSinceStartOfDay(start);
          const endMinutes = minutesSinceStartOfDay(end);
          const durationMinutes = Math.max(endMinutes - startMinutes, 30);
          return { event, startMinutes, durationMinutes };
        })
        .sort((a, b) => a.startMinutes - b.startMinutes),
    [events, date],
  );

  return (
    <section className="space-y-4" aria-label="Day timeline">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Day</p>
          <h2 className="text-2xl font-semibold text-slate-900">
            {formatDate(date, { weekday: "long", month: "long", day: "numeric" })}
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-sm shadow-slate-200/70">
          {(["compact", "normal", "detailed"] as ZoomLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onZoomChange?.(level)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                zoom === level ? "bg-teal-500 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="relative">
          <div className="space-y-0.5">
            {Array.from({ length: 19 }, (_, idx) => {
              const hour = idx + 6; // 6:00 to 24:00
              return (
                <div key={hour} className="relative" style={{ height: hourHeight }}>
                  <div className="absolute left-0 top-0 flex h-full w-full items-start gap-3">
                    <div className="w-12 text-right text-xs font-semibold text-slate-400">{`${hour}:00`}</div>
                    <div className="relative flex-1 border-t border-dashed border-slate-200" />
                  </div>
                </div>
              );
            })}
          </div>

          {dayEvents.map(({ event, startMinutes, durationMinutes }) => {
            const top = ((startMinutes - 360) / 60) * hourHeight; // offset from 6am
            return (
              <div
                key={event.id}
                className="absolute left-16 right-4 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-3 py-2 shadow-sm"
                style={{ top, height: (durationMinutes / 60) * hourHeight }}
              >
                <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                <p className="text-xs text-slate-500">
                  {formatTime(new Date(event.start))}
                  {event.end ? ` – ${formatTime(new Date(event.end))}` : ""}
                </p>
              </div>
            );
          })}

          {nowPosition !== null && (
            <div
              className="absolute left-12 right-2 flex items-center gap-2 text-xs font-semibold text-teal-600"
              style={{ top: nowPosition - 4 }}
            >
              <span className="h-px flex-1 bg-teal-500" aria-hidden />
              <span className="rounded-full bg-teal-50 px-2 py-0.5">Now</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
