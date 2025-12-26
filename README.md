# My Schedule

A PassivePilot-inspired personal scheduling app built with Next.js + TypeScript. Everything runs locally in the browser with no external APIs or servers.

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 to view the app. It is mobile-first and adapts to wider screens.

## Core features
- Calendar and Day views stay in sync with a shared selected date when composed together.
- Natural-language chat bar for adding events (e.g., "math test at 7 pm Thursday").
- Local event store using `localStorage` (no external APIs).
- Manual export/import of data for cross-device sync (JSON backup files).
- Installable PWA with manifest and service worker so you can add it to your phone or desktop.

## Using the modular components
- Switch views: use `TabNavigation` with `CalendarView`, `DayView`, `TasksView`, and `SettingsView` to build a shell.
- Add events: drop in `EventChatPanel` or wire `ChatInput` with `parseNaturalEvent` to append to the `useEvents` store.
- Export/Import: render `SettingsView` to download a backup JSON file or import a saved one (import replaces local data).
- Install as PWA: on iPhone use Safari’s **Add to Home Screen**; on desktop browsers click the **Install** option in the address bar.

Example composition (keep `app/page.tsx` unchanged if you prefer the simple shell):

```tsx
import { SchedulerShell } from "@/app/components/scheduler-shell";

export default function Page() {
  return <SchedulerShell />;
}
```

## Notifications
- Enable notifications in Settings. The app will request permission once and schedule local reminders while it is open or running as an installed PWA.
- No external services are used; reminders stay on the device.
