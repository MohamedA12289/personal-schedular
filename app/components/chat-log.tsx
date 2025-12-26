"use client";

export type ChatMessage = {
  id: string;
  role: "system" | "user";
  text: string;
};

type ChatLogProps = {
  messages: ChatMessage[];
};

export function ChatLog({ messages }: ChatLogProps) {
  return (
    <div className="space-y-2" aria-live="polite">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`max-w-xl rounded-xl px-3 py-2 text-sm shadow-sm ${
            message.role === "user"
              ? "ml-auto bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {message.text}
        </div>
      ))}
    </div>
  );
}
