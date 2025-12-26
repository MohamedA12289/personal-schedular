"use client";

import { useRef, useState } from "react";

import { useEvents } from "@/app/hooks/use-events";

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
  const { events, exportEvents, importFromFile } = useEvents();
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return false;
    return Notification.permission === "granted";
  });
  const [importMessage, setImportMessage] = useState<string | null>(null);
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

  const handleExport = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadText(exportEvents(), `my-schedule-backup-${timestamp}.json`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    const success = await importFromFile(file);
    setImportMessage(success ? "Import successful." : "Import failed. Please check the file format.");
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

          <div className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">Export data</p>
                <p className="text-xs text-slate-500">Download your events as a JSON file for manual sync.</p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-600"
              >
                Export
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">{events.length} event{events.length === 1 ? "" : "s"} saved.</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">Import data</p>
                <p className="text-xs text-slate-500">Choose a previously exported JSON file to replace your current data.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => handleImport(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={handleImportClick}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-purple-200"
                >
                  Import
                </button>
              </div>
            </div>
            {importMessage && <p className="mt-2 text-xs text-slate-600">{importMessage}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}