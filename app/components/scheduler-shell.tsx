"use client";

import { useState } from "react";

import { CalendarView, type CalendarMode } from "@/app/components/calendar-view";
import { DayView } from "@/app/components/day-view";
import { EventChatPanel } from "@/app/components/event-chat-panel";
import { SettingsView } from "@/app/components/settings-view";
import { TabNavigation, type TabDefinition, type TabKey } from "@/app/components/tab-navigation";
import { TasksView } from "@/app/components/tasks-view";
import { TodayView } from "@/app/components/today-view";
import { useEvents } from "@/app/hooks/use-events";
import { formatDate, startOfDay } from "@/app/lib/date-utils";

const TABS: TabDefinition[] = [
  { key: "today", label: "Today" },
  { key: "calendar", label: "Calendar" },
  { key: "tasks", label: "Tasks" },
  { key: "settings", label: "Settings" },
];

function HeaderBar({ focusDate }: { focusDate: Date }) {
  return (
    <header className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-200/70">
          📅
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">My Schedule</p>
          <h1 className="text-2xl font-semibold text-slate-900">PassivePilot-inspired planner</h1>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-md">
        <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
        <span>{formatDate(focusDate, { weekday: "long", month: "long", day: "numeric" })}</span>
      </div>
    </header>
  );
}

export function SchedulerShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("calendar");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [viewDate, setViewDate] = useState(startOfDay(new Date()));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [dayZoom, setDayZoom] = useState<"compact" | "normal" | "detailed">("normal");
  const { events, addEvent } = useEvents();

  const handleSelectDate = (date: Date) => {
    const next = startOfDay(date);
    setSelectedDate(next);
    setViewDate(next);
  };

  const handleChangeMonth = (direction: -1 | 1) => {
    const next = new Date(viewDate);
    next.setMonth(viewDate.getMonth() + direction);
    setViewDate(next);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-24 pt-6">
        <HeaderBar focusDate={selectedDate} />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md shadow-slate-200/70">
          <TabNavigation tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />

          <main className="space-y-6 p-4 sm:p-6" aria-live="polite">
            {activeTab === "today" && <TodayView today={startOfDay(new Date())} events={events} />}

            {activeTab === "calendar" && (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <CalendarView
                    viewDate={viewDate}
                    selectedDate={selectedDate}
                    events={events}
                    mode={calendarMode}
                    onSelectDate={handleSelectDate}
                    onChangeMonth={handleChangeMonth}
                    onModeChange={setCalendarMode}
                  />
                  <DayView date={selectedDate} events={events} zoom={dayZoom} onZoomChange={setDayZoom} />
                </div>
              </div>
            )}

            {activeTab === "tasks" && <TasksView events={events} />}
            {activeTab === "settings" && <SettingsView />}
          </main>
        </div>

        <EventChatPanel
          focusDate={selectedDate}
          onDateSelected={handleSelectDate}
          onEventCreated={() => setActiveTab("calendar")}
          addEvent={addEvent}
        />
      </div>
    </div>
  );
}
