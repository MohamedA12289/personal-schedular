"use client";

import { useCallback, useEffect, useState } from "react";

import type { EventInput, EventItem } from "@/app/types/event";

const STORAGE_KEY = "my-schedule-events";

function readEvents(): EventItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EventItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error("Failed to read events", error);
    return [];
  }
}

function writeEvents(events: EventItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error("Failed to write events", error);
  }
}

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>(() => readEvents());

  useEffect(() => {
    writeEvents(events);
  }, [events]);

  const addEvent = useCallback((input: EventInput) => {
    setEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...input,
      },
    ]);
  }, []);

  const updateEvent = useCallback((id: string, partial: Partial<EventItem>) => {
    setEvents((prev) => prev.map((event) => (event.id === id ? { ...event, ...partial } : event)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  }, []);

  return { events, addEvent, updateEvent, deleteEvent } as const;
}
