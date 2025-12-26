"use client";

import { useState } from "react";

import { ChatInput } from "@/app/components/chat-input";
import { ChatLog, type ChatMessage } from "@/app/components/chat-log";
import { formatDate, formatTime, startOfDay } from "@/app/lib/date-utils";
import { parseNaturalEvent } from "@/app/lib/nlp";
import { useEvents } from "@/app/hooks/use-events";
import type { EventItem } from "@/app/types/event";

type EventChatPanelProps = {
  focusDate?: Date;
  onDateSelected?: (date: Date) => void;
};

export function EventChatPanel({ focusDate = new Date(), onDateSelected }: EventChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      text: "Type natural language to add events (e.g. ‘project due tomorrow at 3pm’).",
    },
  ]);
  const { addEvent } = useEvents();

  const handleSubmit = (value: string) => {
    const parsed = parseNaturalEvent(value, focusDate);
    if (!parsed) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", text: value },
        {
          id: crypto.randomUUID(),
          role: "system",
          text: "I couldn’t understand that. Try ‘math test at 7 pm Thursday’.",
        },
      ]);
      return;
    }

    const event: EventItem = {
      id: crypto.randomUUID(),
      title: parsed.title,
      start: parsed.start.toISOString(),
      end: parsed.end?.toISOString(),
      category: "Personal",
    };

    addEvent(event);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: value },
      {
        id: crypto.randomUUID(),
        role: "system",
        text: `Added: ${parsed.title} on ${formatDate(parsed.start, { weekday: "short", month: "short", day: "numeric" })} at ${formatTime(parsed.start)}.`,
      },
    ]);
    onDateSelected?.(startOfDay(parsed.start));
  };

  return (
    <div className="space-y-3">
      <ChatLog messages={messages} />
      <ChatInput onSubmit={handleSubmit} />
    </div>
  );
}
