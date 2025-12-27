"use client";

import { useRef, useState } from "react";

import { useEvents } from "@/app/hooks/use-events";
import { useTasks } from "@/app/hooks/use-tasks";

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function SettingsView() {
  const {
    events,
    replaceAll: replaceEvents,
    mergeEvents,
    sanitizeEvents,
  } = useEvents();
  const {
    tasks,
    replaceAll: replaceTasks,
    mergeTasks,
    sanitizeTasks,
  } = useTasks();
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return false;
    return Notification.permission === "granted";
  });
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleNotificationToggle = async () => {
    if (typeof Notification === "undefined") {
      setImportMessage("Notifications are not supported in this browser.");
      return;
    }
    if (Notification.permission === "granted") {
      setNotificationsEnabled((prev) => !prev);
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  };

  const handleExportBackup = () => {
    const timestamp = new Date().toISOString();
    const payload = {
      version: 1,
      exportedAt: timestamp,
      events,
      tasks,
    };
    downloadText(JSON.stringify(payload, null, 2), `my-schedule-backup-${timestamp.slice(0, 10)}.json`);
  };

  const triggerImport = (mode: "replace" | "merge") => {
    setImportMode(mode);
    fileInputRef.current?.click();
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid format");
      const importedEvents = sanitizeEvents((parsed as { events?: unknown }).events ?? []);
      const importedTasks = sanitizeTasks((parsed as { tasks?: unknown }).tasks ?? []);

      if (!importedEvents.length && !importedTasks.length) {
        setImportMessage("No valid events or tasks found in file.");
        return;
      }

      if (importMode === "replace") {
        replaceEvents(importedEvents);
        replaceTasks(importedTasks);
        setImportMessage("Replaced local events and tasks with backup file.");
      } else {
        mergeEvents(importedEvents);
        mergeTasks(importedTasks);
        setImportMessage("Merged backup data with existing events and tasks.");
      }
    } catch (error) {
      console.error("Failed to import backup", error);
      setImportMessage("Import failed. Please check the file and try again.");
    }
  };

  return (
    <section className="space-y-4" aria-label="Settings">
      <div className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Control notifications and manual sync for your events.</p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-slate-50 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">Enable notifications on this device</p>
              <p className="text-xs text-slate-500">Notifications work best when the app is open or installed as a PWA.</p>
            </div>
            <button
              type="button"
              onClick={handleNotificationToggle}
              className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                notificationsEnabled ? "bg-teal-500 text-white" : "bg-white text-slate-700"
              }`}
            >
              {notificationsEnabled ? "Enabled" : "Enable"}
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">Backup</p>
                <p className="text-xs text-slate-500">Export or import your events and tasks.</p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-600"
              >
                Export JSON
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{events.length} event{events.length === 1 ? "" : "s"}</span>
              <span className="h-3 w-px bg-slate-300" aria-hidden />
              <span>{tasks.length} task{tasks.length === 1 ? "" : "s"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => handleImport(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => triggerImport("replace")}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-purple-200"
              >
                Import (Replace)
              </button>
              <button
                type="button"
                onClick={() => triggerImport("merge")}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-purple-200"
              >
                Import (Merge)
              </button>
            </div>
            {importMessage && <p className="text-xs text-slate-600">{importMessage}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
