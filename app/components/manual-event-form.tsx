"use client";

import { useEffect, useMemo, useState } from "react";

import type { EventCategory, EventInput } from "@/app/types/event";

type ManualEventFormProps = {
  selectedDate: Date;
  onAdd: (input: EventInput) => void;
  onDateChange?: (date: Date) => void;
};

const CATEGORY_OPTIONS: EventCategory[] = [
  "School",
  "Work",
  "Gym",
  "Money",
  "Personal",
  "Business",
  "Other",
];

const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60];

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function ManualEventForm({ selectedDate, onAdd, onDateChange }: ManualEventFormProps) {
  const [title, setTitle] = useState("");
  const [dateValue, setDateValue] = useState(toDateInputValue(selectedDate));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState<EventCategory>("Personal");
  const [reminderMinutes, setReminderMinutes] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setDateValue(toDateInputValue(selectedDate));
  }, [selectedDate]);

  const isSaveDisabled = useMemo(() => !title.trim() || !startTime || !dateValue, [dateValue, startTime, title]);

  const handleSubmit = () => {
    setStatus(null);
    if (isSaveDisabled) return;

    const start = new Date(`${dateValue}T${startTime}`);
    const end = endTime ? new Date(`${dateValue}T${endTime}`) : new Date(start.getTime() + 60 * 60 * 1000);

    if (end && end < start) {
      setStatus("End time must be after the start time.");
      return;
    }

    const payload: EventInput = {
      title: title.trim(),
      start: start.toISOString(),
      end: end?.toISOString(),
      category,
      notes: notes.trim() ? notes.trim() : undefined,
      reminderMinutesBefore: reminderMinutes || undefined,
    };

    onAdd(payload);
    onDateChange?.(start);

    setStatus("Saved");
    setTitle("");
    setStartTime("09:00");
    setEndTime("");
    setCategory("Personal");
    setReminderMinutes(0);
    setNotes("");
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Manual add</p>
          <h2 className="text-lg font-semibold text-slate-900">Create an event or task</h2>
        </div>
        {status && <span className="text-xs font-semibold text-emerald-600">{status}</span>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Title
          <input
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-900 shadow-inner"
            placeholder="e.g. Project review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Date
          <input
            type="date"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-900 shadow-inner"
            value={dateValue}
            onChange={(e) => {
              setDateValue(e.target.value);
              if (e.target.value) {
                onDateChange?.(new Date(`${e.target.value}T00:00:00`));
              }
            }}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Start time
          <input
            type="time"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-900 shadow-inner"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          End time (optional)
          <input
            type="time"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-900 shadow-inner"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Category
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-900 shadow-inner"
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Reminder
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-900 shadow-inner"
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(parseInt(e.target.value, 10))}
          >
            <option value={0}>None</option>
            {REMINDER_OPTIONS.filter((opt) => opt !== 0).map((opt) => (
              <option key={opt} value={opt}>
                {opt} minutes before
              </option>
            ))}
          </select>
        </label>

        <label className="sm:col-span-2 flex flex-col gap-1 text-sm text-slate-700">
          Notes (optional)
          <textarea
            className="min-h-[80px] rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-900 shadow-inner"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context, links, or prep work"
          />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={isSaveDisabled}
          onClick={handleSubmit}
          className={`rounded-full px-4 py-2 text-sm font-semibold shadow-md transition ${
            isSaveDisabled ? "cursor-not-allowed bg-slate-200 text-slate-500" : "bg-teal-500 text-white hover:bg-teal-600"
          }`}
        >
          Save
        </button>
      </div>
    </section>
  );
}