# My personal shiesty planner

A local-first, PassivePilot-inspired planner built with Next.js + TypeScript. It keeps everything on your
device: calendar/day/list views, natural-language chat input, manual add forms, notifications, and manual
backup/restore. No external APIs or cloud services are required.

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
  `this evening gym`, `in 2 hours finish report`, `after lunch sync`, `gym from 5 to 7 from jan 3 to mar 10`,
  and shorthand months/weekdays (`mon`, `tues`, `sept`, `dec`).
- **Manual add panel:** create events/tasks with title, date, start/end time, category (School/Work/Gym/Money/Personal/Business/Other),
  optional reminders, and notes.
- **Local-first data:** events stay in `localStorage` so they persist offline and across reloads.
- **Reminders:** enable notifications in Settings to schedule local reminders (device/PWA must be open or
  installed for best results).
- **Manual sync:** Export to a JSON backup file and Import it on another device to transfer data.
- **PWA-ready:** manifest, icons, and service worker so you can install on mobile (Add to Home Screen) or
  desktop browsers (Install app) and stay offline with local data.

## Using the modular components

- Switch views with `TabNavigation` plus `CalendarView`, `DayView`, `TasksView`, and `SettingsView`.
- Add events through `EventChatPanel`, the manual form, or wire `ChatInput` with `parseNaturalEvent` to feed the `useEvents` store (date ranges will return multiple events).
- Export/Import via `SettingsView` to download a JSON backup or restore one (import replaces local data).
- Install as a PWA: Safari on iPhone → **Add to Home Screen**; desktop browsers → **Install** from the address bar.

### Example phrases

- `math test tmrw at 7 pm`
- `2moro 3pm dentist appointment`
- `this evening gym at 8`
- `work shift from 9 to 5 from dec 1 to dec 31`

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
