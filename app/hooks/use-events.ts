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

function normalizeEvent(event: EventItem): EventItem {
  return {
    ...event,
    start: new Date(event.start).toISOString(),
    end: event.end ? new Date(event.end).toISOString() : undefined,
  };
}

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>(() => readEvents());

  useEffect(() => {
    writeEvents(events);
  }, [events]);

  const addEvent = useCallback((input: EventInput) => {
    const newEvent = normalizeEvent({ ...(input as EventItem), id: crypto.randomUUID() });
    setEvents((prev) => [...prev, newEvent]);
  }, []);

  const addEvents = useCallback((inputs: EventInput[]) => {
    const normalized = inputs.map((input) => normalizeEvent({ ...(input as EventItem), id: crypto.randomUUID() }));
    setEvents((prev) => [...prev, ...normalized]);
  }, []);

  const updateEvent = useCallback((id: string, partial: Partial<EventItem>) => {
    setEvents((prev) => prev.map((event) => (event.id === id ? normalizeEvent({ ...event, ...partial }) : event)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  }, []);

  const replaceAll = useCallback((next: EventItem[]) => {
    setEvents(next.map(normalizeEvent));
  }, []);

  const exportEvents = useCallback(() => JSON.stringify(events, null, 2), [events]);

  const importFromFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return false;
      const valid = parsed.filter((item): item is EventItem => typeof item?.id === "string" && typeof item?.title === "string");
      replaceAll(valid);
      return true;
    } catch (error) {
      console.error("Failed to import events", error);
      return false;
    }
  }, [replaceAll]);

  return { events, addEvent, addEvents, updateEvent, deleteEvent, replaceAll, exportEvents, importFromFile } as const;
}
