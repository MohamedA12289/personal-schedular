"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { EventInput, EventItem } from "@/app/types/event";
import {
  deleteEventRow,
  fetchUserEvents,
  getSupabaseContext,
  insertEventRow,
  subscribeToEvents,
  updateEventRow,
} from "@/app/lib/supabase/client";

const STORAGE_KEY = "my-schedule-events";
const RECENT_TTL_MS = 2000;

export function createEventId(): string {
  const cryptoApi = typeof globalThis !== "undefined" ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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

function sanitizeEvents(payload: unknown): EventItem[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((item): item is EventItem =>
      typeof item?.id === "string" && typeof item?.title === "string" && typeof item?.start === "string"
    )
    .map(normalizeEvent);
}

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>(() => readEvents());
  const [userId, setUserId] = useState<string | null>(null);
  const recentIds = useRef<Set<string>>(new Set());
  const eventsRef = useRef<EventItem[]>(events);

  const markRecent = useCallback((id: string) => {
    recentIds.current.add(id);
    setTimeout(() => {
      recentIds.current.delete(id);
    }, RECENT_TTL_MS);
  }, []);

  useEffect(() => {
    writeEvents(events);
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const supabase = getSupabaseContext();
    if (!supabase?.session?.userId) return;

    let isMounted = true;
    const hydrate = async () => {
      const remote = await fetchUserEvents(supabase, supabase.session!.userId);
      if (!isMounted) return;
      setUserId(supabase.session!.userId);
      if (remote.length) {
        setEvents((prev) => {
          const map = new Map<string, EventItem>();
          prev.forEach((event) => map.set(event.id, normalizeEvent(event)));
          remote.forEach((event) => map.set(event.id, normalizeEvent(event)));
          return Array.from(map.values());
        });
      }
    };

    hydrate();

    const cleanup = subscribeToEvents(supabase, supabase.session.userId, (payload) => {
      const incomingId = payload.new?.id ?? payload.old?.id;
      if (incomingId && recentIds.current.has(incomingId)) return;

      if (payload.type === "INSERT" || payload.type === "UPDATE") {
        if (!payload.new) return;
        setEvents((prev) => {
          const next = prev.filter((event) => event.id !== payload.new!.id);
          return [...next, normalizeEvent(payload.new!)];
        });
      }

      if (payload.type === "DELETE" && payload.old?.id) {
        setEvents((prev) => prev.filter((event) => event.id !== payload.old!.id));
      }
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, []);

  const addEvent = useCallback(
    async (input: EventInput) => {
      const supabase = getSupabaseContext();
      const localEvent = normalizeEvent({ ...(input as EventItem), id: createEventId() });
      markRecent(localEvent.id);
      setEvents((prev) => [...prev, localEvent]);

      if (!supabase?.session?.userId) return;

      const created = await insertEventRow(supabase, supabase.session.userId, localEvent);
      if (created) {
        markRecent(created.id);
        setEvents((prev) => {
          const filtered = prev.filter((event) => event.id !== localEvent.id);
          return [...filtered, normalizeEvent(created)];
        });
      }
    },
    [markRecent]
  );

  const addEvents = useCallback(
    async (inputs: EventInput[]) => {
      const supabase = getSupabaseContext();
      const normalized = inputs.map((input) => normalizeEvent({ ...(input as EventItem), id: createEventId() }));
      normalized.forEach((event) => markRecent(event.id));
      setEvents((prev) => [...prev, ...normalized]);

      if (supabase?.session?.userId) {
        await Promise.all(
          normalized.map(async (event) => {
            const created = await insertEventRow(supabase, supabase.session!.userId, event);
            if (created) {
              markRecent(created.id);
              setEvents((prev) => {
                const filtered = prev.filter((existing) => existing.id !== event.id);
                return [...filtered, normalizeEvent(created)];
              });
            }
          })
        );
      }
    },
    [markRecent]
  );

  const updateEvent = useCallback(
    async (id: string, partial: Partial<EventItem>) => {
      markRecent(id);
      setEvents((prev) => prev.map((event) => (event.id === id ? normalizeEvent({ ...event, ...partial }) : event)));

      const supabase = getSupabaseContext();
      if (supabase?.session?.userId) {
        const current = eventsRef.current.find((event) => event.id === id);
        const merged = current ? { ...current, ...partial } : { ...(partial as EventItem), id };
        await updateEventRow(supabase, supabase.session.userId, id, merged);
      }
    },
    [markRecent]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      markRecent(id);
      setEvents((prev) => prev.filter((event) => event.id !== id));

      const supabase = getSupabaseContext();
      if (supabase?.session?.userId) {
        await deleteEventRow(supabase, supabase.session.userId, id);
      }
    },
    [markRecent]
  );

  const replaceAll = useCallback((next: EventItem[]) => {
    setEvents(next.map(normalizeEvent));
  }, []);

  const mergeEvents = useCallback((incoming: EventItem[]) => {
    if (!incoming.length) return;
    setEvents((prev) => {
      const map = new Map<string, EventItem>();
      prev.forEach((event) => map.set(event.id, normalizeEvent(event)));
      incoming.forEach((event) => map.set(event.id, normalizeEvent(event)));
      return Array.from(map.values());
    });
  }, []);

  const exportEvents = useCallback(() => JSON.stringify(events, null, 2), [events]);

  const importFromFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const valid = sanitizeEvents(parsed);
        if (!valid.length) return false;
        replaceAll(valid);
        return true;
      } catch (error) {
        console.error("Failed to import events", error);
        return false;
      }
    },
    [replaceAll]
  );

  return {
    events,
    addEvent,
    addEvents,
    updateEvent,
    deleteEvent,
    replaceAll,
    mergeEvents,
    exportEvents,
    importFromFile,
    sanitizeEvents,
    userId,
  } as const;
}
