import type { EventItem } from "@/app/types/event";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Minimal exported client placeholder for callers that expect a Supabase instance.
// The app primarily uses fetch-based helpers below; this keeps older imports from
// breaking while remaining safe when env vars are absent.
export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? ({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } as const)
    : null;

export type SupabaseSession = {
  accessToken: string;
  userId: string;
};

export type SupabaseContext = {
  url: string;
  anonKey: string;
  session: SupabaseSession | null;
};

function parseStoredSession(projectRef: string): SupabaseSession | null {
  if (typeof window === "undefined") return null;
  const key = `sb-${projectRef}-auth-token`;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const session = parsed?.currentSession ?? parsed?.session ?? parsed?.data?.session ?? parsed;
    const accessToken: string | undefined = session?.access_token ?? session?.accessToken;
    const userId: string | undefined = session?.user?.id ?? session?.user_id;
    if (accessToken && userId) {
      return { accessToken, userId };
    }
  } catch (error) {
    console.warn("Failed to parse Supabase session", error);
  }
  return null;
}

export function getSupabaseContext(): SupabaseContext | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (typeof window !== "undefined") {
      console.warn("Supabase environment variables are missing. Running local-only event storage.");
    }
    return null;
  }

  const projectRefMatch = SUPABASE_URL.match(/https?:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
  const projectRef = projectRefMatch?.[1];
  const session = projectRef ? parseStoredSession(projectRef) : null;

  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, session };
}

async function supabaseFetch<T>(ctx: SupabaseContext, path: string, init?: RequestInit): Promise<T | null> {
  const headers: Record<string, string> = {
    apikey: ctx.anonKey,
    "Content-Type": "application/json",
  };
  if (ctx.session?.accessToken) {
    headers.Authorization = `Bearer ${ctx.session.accessToken}`;
  }

  try {
    const response = await fetch(`${ctx.url}${path}`, { ...init, headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) } });
    if (!response.ok) {
      console.warn("Supabase request failed", response.status, response.statusText);
      return null;
    }
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn("Supabase request error", error);
    return null;
  }
}

export type EventRow = {
  id: string;
  user_id: string;
  title: string;
  start: string;
  end?: string | null;
  all_day?: boolean | null;
  notes?: string | null;
  category?: string | null;
  reminder_minutes_before?: number | null;
};

export function mapRowToEvent(row: EventRow): EventItem {
  return {
    id: row.id,
    title: row.title,
    start: row.start,
    end: row.end ?? undefined,
    allDay: row.all_day ?? undefined,
    notes: row.notes ?? undefined,
    category: (row.category as EventItem["category"]) ?? undefined,
    reminderMinutesBefore: row.reminder_minutes_before ?? undefined,
  };
}

export function mapEventToRow(event: EventItem, userId: string): EventRow {
  return {
    id: event.id,
    user_id: userId,
    title: event.title,
    start: event.start,
    end: event.end ?? null,
    all_day: event.allDay ?? null,
    notes: event.notes ?? null,
    category: event.category ?? null,
    reminder_minutes_before: event.reminderMinutesBefore ?? null,
  };
}

export async function fetchUserEvents(ctx: SupabaseContext, userId: string): Promise<EventItem[]> {
  const data = await supabaseFetch<EventRow[]>(ctx, `/rest/v1/events?user_id=eq.${encodeURIComponent(userId)}&order=start`);
  if (!data) return [];
  return data.map(mapRowToEvent);
}

export async function insertEventRow(ctx: SupabaseContext, userId: string, event: EventItem): Promise<EventItem | null> {
  const body = JSON.stringify(mapEventToRow(event, userId));
  const data = await supabaseFetch<EventRow[]>(ctx, "/rest/v1/events", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body,
  });
  if (!data?.length) return null;
  return mapRowToEvent(data[0]);
}

export async function updateEventRow(ctx: SupabaseContext, userId: string, id: string, partial: Partial<EventItem>): Promise<EventItem | null> {
  const body = JSON.stringify(mapEventToRow({ ...(partial as EventItem), id, title: partial.title ?? "" }, userId));
  const data = await supabaseFetch<EventRow[]>(ctx, `/rest/v1/events?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body,
  });
  if (!data?.length) return null;
  return mapRowToEvent(data[0]);
}

export async function deleteEventRow(ctx: SupabaseContext, userId: string, id: string): Promise<boolean> {
  const data = await supabaseFetch<EventRow[]>(ctx, `/rest/v1/events?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  return data !== null;
}

type RealtimeHandler = (payload: { type: "INSERT" | "UPDATE" | "DELETE"; new?: EventItem; old?: EventItem }) => void;

type RealtimeCleanup = () => void;

export function subscribeToEvents(ctx: SupabaseContext, userId: string, onChange: RealtimeHandler): RealtimeCleanup | null {
  if (typeof WebSocket === "undefined") return null;
  const token = ctx.session?.accessToken ?? ctx.anonKey;
  const socketUrl = `${ctx.url.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(ctx.anonKey)}&vsn=1.0.0&token=${encodeURIComponent(token)}`;

  let ref = 1;
  const socket = new WebSocket(socketUrl);
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (heartbeat) clearInterval(heartbeat);
    socket.close();
  };

  socket.addEventListener("open", () => {
    const joinPayload = {
      topic: `realtime:public:events:user_id=eq.${userId}`,
      event: "phx_join",
      payload: {
        config: {
          broadcast: { self: false },
          postgres_changes: [
            { event: "*", schema: "public", table: "events", filter: `user_id=eq.${userId}` },
          ],
        },
      },
      ref: `${ref++}`,
    };
    socket.send(JSON.stringify(joinPayload));
    heartbeat = setInterval(() => {
      socket.send(
        JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: `${ref++}` })
      );
    }, 25_000);
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data?.event === "postgres_changes" && data?.payload) {
        const payload = data.payload as { type: "INSERT" | "UPDATE" | "DELETE"; new?: EventRow; old?: EventRow };
        if (payload.type === "INSERT" || payload.type === "UPDATE") {
          onChange({ type: payload.type, new: payload.new ? mapRowToEvent(payload.new) : undefined });
        }
        if (payload.type === "DELETE") {
          onChange({ type: "DELETE", old: payload.old ? mapRowToEvent(payload.old) : undefined });
        }
      }
    } catch (error) {
      console.warn("Realtime payload parse failed", error);
    }
  });

  socket.addEventListener("error", (error) => {
    console.warn("Supabase realtime socket error", error);
  });

  return cleanup;
}
