"use client";

import { useState } from "react";

type Tab = "today" | "week" | "tasks" | "settings";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("today");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-500 flex items-center justify-center text-xs font-bold">
            MS
          </div>
          <div>
            <h1 className="text-lg font-semibold">My Schedule</h1>
            <p className="text-xs text-slate-400">
              Personal offline planner • Local only
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-400">
          {new Date().toLocaleDateString()}
        </span>
      </header>

      {/* Tabs */}
      <nav className="border-b border-slate-800 px-4 py-2 flex gap-2 text-sm">
        <TabButton
          label="Today"
          isActive={activeTab === "today"}
          onClick={() => setActiveTab("today")}
        />
        <TabButton
          label="Week"
          isActive={activeTab === "week"}
          onClick={() => setActiveTab("week")}
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
      <section className="flex-1 px-4 py-4">
        {activeTab === "today" && <TodayView />}
        {activeTab === "week" && <WeekView />}
        {activeTab === "tasks" && <TasksView />}
        {activeTab === "settings" && <SettingsView />}
      </section>
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
      className={`px-3 py-1 rounded-full border text-xs md:text-sm transition
      ${
        isActive
          ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
          : "border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function TodayView() {
  return (
    <div className="space-y-3">
      <h2 className="text-base md:text-lg font-semibold">Today</h2>
      <p className="text-sm text-slate-400">
        This will show today&apos;s schedule (classes, work, business, etc.).
      </p>
      <div className="border border-slate-800 rounded-xl p-3 text-sm text-slate-300">
        <p className="text-slate-400 text-xs mb-2">Coming soon:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Timeline of your day</li>
          <li>Blocks for study / work / gym / business</li>
          <li>Quick add event</li>
        </ul>
      </div>
    </div>
  );
}

function WeekView() {
  return (
    <div className="space-y-3">
      <h2 className="text-base md:text-lg font-semibold">Week Overview</h2>
      <p className="text-sm text-slate-400">
        This will be a 7-day grid that shows your main tasks and events.
      </p>
      <div className="border border-slate-800 rounded-xl p-3 text-xs text-slate-400">
        Placeholder weekly view. We&apos;ll turn this into a real calendar next.
      </div>
    </div>
  );
}

function TasksView() {
  return (
    <div className="space-y-3">
      <h2 className="text-base md:text-lg font-semibold">Tasks</h2>
      <p className="text-sm text-slate-400">
        This tab will manage your to-dos: school, work, Passive Pilot, life.
      </p>
      <div className="border border-slate-800 rounded-xl p-3 text-xs text-slate-400">
        Soon: task list with categories (School, Work, Business, Personal) and
        priorities.
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-3">
      <h2 className="text-base md:text-lg font-semibold">Settings</h2>
      <p className="text-sm text-slate-400">
        Later we&apos;ll add options like dark/light, default view, backups,
        etc.
      </p>
      <div className="border border-slate-800 rounded-xl p-3 text-xs text-slate-400">
        Local-only app. No external APIs. All data stays on your device.
      </div>
    </div>
  );
}
