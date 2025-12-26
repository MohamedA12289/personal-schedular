"use client";

import { useState } from "react";

import { ChatInput } from "@/app/components/chat-input";
import { ChatLog, type ChatMessage } from "@/app/components/chat-log";
import { formatDate, formatTime, startOfDay } from "@/app/lib/date-utils";
import { parseNaturalEvent } from "@/app/lib/nlp";
import { useEvents } from "@/app/hooks/use-events";
import type { EventInput } from "@/app/types/event";

type EventChatPanelProps = {
  focusDate?: Date;
  onDateSelected?: (date: Date) => void;
  onEventCreated?: (event: EventInput) => void;
  addEvent?: (event: EventInput) => void;
};

export function EventChatPanel({ focusDate = new Date(), onDateSelected, onEventCreated, addEvent }: EventChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      text: "Type natural language to add events (e.g. ‘project due tomorrow at 3pm’).",
    },
  ]);
  const eventsApi = useEvents();
  const addEventHandler = addEvent ?? eventsApi.addEvent;
  const addEventsHandler = eventsApi.addEvents;

  const handleSubmit = (value: string) => {
    const parsed = parseNaturalEvent(value, focusDate);
    if (!parsed || parsed.events.length === 0) {
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

    const inputs: EventInput[] = parsed.events.map((event) => ({
      title: event.title,
      start: event.start.toISOString(),
      end: event.end?.toISOString(),
      category: "Personal",
    }));

    if (inputs.length === 1) {
      addEventHandler(inputs[0]);
    } else {
      addEventsHandler(inputs);
    }
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: value },
      {
        id: crypto.randomUUID(),
        role: "system",
        text:
          inputs.length === 1
            ? `Added: ${inputs[0].title} on ${formatDate(new Date(inputs[0].start), { weekday: "short", month: "short", day: "numeric" })} at ${formatTime(new Date(inputs[0].start))}.`
            : `Added ${inputs.length} events starting ${formatDate(new Date(inputs[0].start), { month: "short", day: "numeric" })}.`,
      },
    ]);
    const targetDate = startOfDay(new Date(inputs[0].start));
    onDateSelected?.(targetDate);
    onEventCreated?.(inputs[0]);
  };

  return (
    <div className="space-y-3">
      <ChatLog messages={messages} />
      <ChatInput onSubmit={handleSubmit} />
    </div>
  );
}