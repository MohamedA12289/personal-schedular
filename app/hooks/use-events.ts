"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/app/lib/supabase/client";
import type { EventInput, EventItem } from "@/app/types/event";

const STORAGE_KEY = "my-schedule-events";

export function createEventId(): string {
  const cryptoApi = typeof globalThis !== "undefined" ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readEvents(): EventItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EventItem[];
    return Array.isArray(parsed) ? parsed : [];
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

type DbEventRow = {
  id: string;
  user_id: string;
  title: string;
  start: string;
  end: string | null;
  notes: string | null;
  category: string | null;
};

function dbRowToEvent(row: DbEventRow): EventItem {
  return normalizeEvent({
    id: row.id,
    title: row.title,
    start: row.start,
    end: row.end ?? undefined,
    notes: row.notes ?? undefined,
    category: row.category ?? undefined,
  } as EventItem);
}

// IMPORTANT: we include id so local + cloud + realtime all match (no temp-id swapping)
function eventToDbRow(userId: string, id: string, input: EventInput) {
  return {
    id,
    user_id: userId,
    title: input.title,
    start: input.start,
    end: input.end ?? null,
    notes: input.notes ?? null,
    category: input.category ?? null,
  };
}

function mergeById(local: EventItem[], remote: EventItem[]) {
  const map = new Map<string, EventItem>();
  for (const e of local) map.set(e.id, normalizeEvent(e));
  for (const e of remote) map.set(e.id, normalizeEvent(e)); // remote wins if same id
  return Array.from(map.values()).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function upsertOne(prev: EventItem[], incoming: EventItem) {
  return mergeById(prev, [incoming]);
}

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>(() => readEvents());
  const [cloudReady, setCloudReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const didInitialCloudLoad = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // local-first persistence
  useEffect(() => {
    writeEvents(events);
  }, [events]);

  // initial cloud load + track user
  useEffect(() => {
    const load = async () => {
      if (didInitialCloudLoad.current) return;
      didInitialCloudLoad.current = true;

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) console.warn("auth.getUser error:", userErr.message);

      if (!user) {
        setUserId(null);
        setCloudReady(true);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("events")
        .select("id,user_id,title,start,end,notes,category")
        .order("start", { ascending: true });

      if (error) {
        console.error("Failed to load cloud events", error.message);
        setCloudReady(true);
        return;
      }

      const remote = (data ?? []).map((row: any) => dbRowToEvent(row as DbEventRow));
      setEvents((prev) => mergeById(prev, remote));
      setCloudReady(true);
    };

    load();
  }, []);

  // realtime subscribe (only when logged in)
  useEffect(() => {
    if (!cloudReady) return;
    if (!userId) return;

    // hot reload safe cleanup
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`events-realtime-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as any;
            const id = oldRow?.id as string | undefined;
            if (!id) return;
            setEvents((prev) => prev.filter((e) => e.id !== id));
            return;
          }

          const newRow = payload.new as any;
          if (!newRow?.id) return;
          const incoming = dbRowToEvent(newRow as DbEventRow);
          setEvents((prev) => upsertOne(prev, incoming));
        },
      );

    channelRef.current = channel;

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") console.error("Realtime channel error");
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [cloudReady, userId]);

  const canCloudWrite = useMemo(() => !!userId, [userId]);

  const addEvent = useCallback(
    async (input: EventInput) => {
      const normalizedInput: EventInput = {
        ...input,
        start: new Date(input.start).toISOString(),
        end: input.end ? new Date(input.end).toISOString() : undefined,
      };

      const id = createEventId();
      const localEvent = normalizeEvent({ ...(normalizedInput as EventItem), id });
      setEvents((prev) => [...prev, localEvent]);

      if (!canCloudWrite || !userId) return;

      const { error } = await supabase.from("events").insert(eventToDbRow(userId, id, normalizedInput));
      if (error) console.error("Failed to insert cloud event", error.message);
    },
    [canCloudWrite, userId],
  );

  const addEvents = useCallback(
    async (inputs: EventInput[]) => {
      const normalizedInputs = inputs.map((i) => ({
        ...i,
        start: new Date(i.start).toISOString(),
        end: i.end ? new Date(i.end).toISOString() : undefined,
      }));

      const batch = normalizedInputs.map((input) => {
        const id = createEventId();
        return {
          id,
          local: normalizeEvent({ ...(input as EventItem), id }),
          db: input,
        };
      });

      setEvents((prev) => [...prev, ...batch.map((b) => b.local)]);

      if (!canCloudWrite || !userId) return;

      const payload = batch.map((b) => eventToDbRow(userId, b.id, b.db));
      const { error } = await supabase.from("events").insert(payload);
      if (error) console.error("Failed to insert cloud events", error.message);
    },
    [canCloudWrite, userId],
  );

  const updateEvent = useCallback(
    async (id: string, partial: Partial<EventItem>) => {
      setEvents((prev) => prev.map((e) => (e.id === id ? normalizeEvent({ ...e, ...partial }) : e)));

      if (!canCloudWrite || !userId) return;

      const patch: any = {};
      if (partial.title !== undefined) patch.title = partial.title;
      if (partial.start !== undefined) patch.start = new Date(partial.start).toISOString();
      if (partial.end !== undefined) patch.end = partial.end ? new Date(partial.end).toISOString() : null;
      if (partial.notes !== undefined) patch.notes = partial.notes ?? null;
      if (partial.category !== undefined) patch.category = partial.category ?? null;

      const { error } = await supabase.from("events").update(patch).eq("id", id).eq("user_id", userId);
      if (error) console.error("Failed to update cloud event", error.message);
    },
    [canCloudWrite, userId],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));

      if (!canCloudWrite || !userId) return;

      const { error } = await supabase.from("events").delete().eq("id", id).eq("user_id", userId);
      if (error) console.error("Failed to delete cloud event", error.message);
    },
    [canCloudWrite, userId],
  );

  const replaceAll = useCallback((next: EventItem[]) => {
    // local-only (no mass cloud overwrite)
    setEvents(next.map(normalizeEvent));
  }, []);

  const exportEvents = useCallback(() => JSON.stringify(events, null, 2), [events]);

  const importFromFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) return false;

        const valid = parsed.filter(
          (item): item is EventItem => typeof item?.id === "string" && typeof item?.title === "string",
        );

        replaceAll(valid);
        return true;
      } catch (error) {
        console.error("Failed to import events", error);
        return false;
      }
    },
    [replaceAll],
  );

  return { events, addEvent, addEvents, updateEvent, deleteEvent, replaceAll, exportEvents, importFromFile } as const;
}
