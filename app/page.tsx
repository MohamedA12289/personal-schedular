"use client";

import { useState } from "react";

type Tab = "today" | "calendar" | "tasks" | "settings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("today");

  return (
    <main className="min-h-screen bg-gray-100 text-slate-900 flex justify-center px-4 py-6">
      <div className="w-full max-w-3xl space-y-4">
        {/* Top bar */}
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 px-5 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">My Schedule</h1>
            <p className="text-xs text-slate-500">
              Personal planner • local only
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {new Date().toLocaleDateString()}
          </span>
        </header>

        {/* Tabs */}
        <nav className="bg-white rounded-2xl shadow-sm border border-gray-200 px-3 py-2 flex gap-2 text-sm">
          <TabButton
            label="Today"
            isActive={activeTab === "today"}
            onClick={() => setActiveTab("today")}
          />
          <TabButton
            label="Calendar"
            isActive={activeTab === "calendar"}
            onClick={() => setActiveTab("calendar")}
          />
          <TabButton
            label="Tasks"
            isActive={activeTab === "tasks"}
            onClick={() => setActiveTab("tasks")}
          />
          <TabButton
            label="Settings"
            isActive={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </nav>

        {/* Content */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 px-5 py-4 min-h-[300px]">
          {activeTab === "today" && (
            <div>
              <h2 className="text-base font-semibold mb-1">Today</h2>
              <p className="text-sm text-slate-500">
                This will show today&apos;s schedule.
              </p>
            </div>
          )}
          {activeTab === "calendar" && (
            <div>
              <h2 className="text-base font-semibold mb-1">Calendar</h2>
              <p className="text-sm text-slate-500">
                This will become the Apple Calendar-style view.
              </p>
            </div>
          )}
          {activeTab === "tasks" && (
            <div>
              <h2 className="text-base font-semibold mb-1">Tasks</h2>
              <p className="text-sm text-slate-500">
                This will show all tasks across days.
              </p>
            </div>
          )}
          {activeTab === "settings" && (
            <div>
              <h2 className="text-base font-semibold mb-1">Settings</h2>
              <p className="text-sm text-slate-500">
                This will include notifications, export/import, and PWA info.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-xs md:text-sm border transition " +
        (isActive
          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
          : "bg-gray-50 text-slate-600 border-gray-200 hover:bg-white")
      }
    >
      {label}
    </button>
  );
}
