# My personal shiesty planner

A local-first, PassivePilot-inspired planner built with Next.js + TypeScript. It keeps everything on your
device: calendar/day/list views, natural-language chat input, notifications, and manual backup/restore.
No external APIs or cloud services are required.

## Quickstart

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Optional checks:

```bash
npm run lint -- --max-warnings=0
npm run build
```

## Features

- **Views:** Calendar (month/week), Day timeline with "Now" indicator, Tasks/List, Settings.
- **Natural language chat:** understands phrases like `math test at 7 pm Thursday`, `tmrw 3pm dentist`,
  `this evening gym`, `in 2 hours finish report`, `after lunch sync`.
- **Local-first data:** events stay in `localStorage` so they persist offline and across reloads.
- **Reminders:** enable notifications in Settings to schedule local reminders (device/PWA must be open or
  installed for best results).
- **Manual sync:** Export to a JSON backup file and Import it on another device to transfer data.
- **PWA-ready:** manifest, icons, and service worker so you can install on mobile (Add to Home Screen) or
  desktop browsers (Install app).

## Using the modular components

- Switch views with `TabNavigation` plus `CalendarView`, `DayView`, `TasksView`, and `SettingsView`.
- Add events through `EventChatPanel` or wire `ChatInput` with `parseNaturalEvent` to feed the `useEvents` store.
- Export/Import via `SettingsView` to download a JSON backup or restore one (import replaces local data).
- Install as a PWA: Safari on iPhone → **Add to Home Screen**; desktop browsers → **Install** from the address bar.

Example composition (keep `app/page.tsx` unchanged if you prefer the existing shell):

```tsx
import { SchedulerShell } from "@/app/components/scheduler-shell";

export default function Page() {
  return <SchedulerShell />;
}
```

## Notifications

- Enable notifications in Settings. The app will request permission once and schedule local reminders while
  it is open or running as an installed PWA.
- No external services are used; reminders stay on the device.
