"use client";

import { FormEvent, useState } from "react";

export type ChatInputProps = {
  placeholder?: string;
  buttonLabel?: string;
  onSubmit: (value: string) => void;
};

export function ChatInput({ placeholder = "e.g. math test at 7 pm Thursday", buttonLabel = "Add", onSubmit }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSend = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <form
      className="sticky bottom-4 mx-auto flex max-w-6xl flex-col gap-2 rounded-2xl border border-gray-200 bg-white/80 p-3 backdrop-blur shadow-lg shadow-slate-300/50"
      onSubmit={handleSend}
    >
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400" htmlFor="chat-input">
        Quick add
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-teal-300">
        <input
          id="chat-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-slate-900 outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-teal-600"
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
