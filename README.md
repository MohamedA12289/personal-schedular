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

- **Views:** Calendar (month/week/year), Day timeline with "Now" indicator, Tasks/List, Settings.
- **Natural language chat:** understands phrases like `math test at 7 pm Thursday`, `tmrw 3pm dentist`,
  `tonite gym`, `in 2 hours finish report`, `after lunch sync`, `math class from 4 to 6 from dec 25 to feb 24` (range noted),
  and shorthand months/weekdays (`mon`, `tues`, `sept`, `dec`).
- **Manual add panel:** create events/tasks with title, date, start/end time (defaults to one hour), category (School/Work/Gym/Money/Personal/Business/Other),
  optional reminders, and notes.
- **Local-first data:** events stay in `localStorage` so they persist offline and across reloads.
- **Reminders:** enable notifications in Settings to schedule local reminders (device/PWA must be open or
  installed for best results).
- **Manual sync:** Export to a JSON backup file and Import it on another device to transfer data.
- **PWA-ready:** manifest, icons, and service worker so you can install on mobile (Add to Home Screen) or
  desktop browsers (Install app) and stay offline with local data.

## Supabase realtime (optional)

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
- Enable publications: Database → **Replication** → **Publications** → add the `events` table to `supabase_realtime`.
- Confirm Row Level Security allows the signed-in user to read/write their own `events` rows (filter on `user_id`).
- When signed in on multiple devices, inserts/updates/deletes stream via `postgres_changes` and merge with the local
  cache; if Supabase is unavailable or you are logged out, the planner continues in local-only mode.

## Using the modular components

- Switch views with `TabNavigation` plus `CalendarView`, `DayView`, `TasksView`, and `SettingsView`.
- Add events through `EventChatPanel`, the manual form, or wire `ChatInput` with `parseNaturalEvent` to feed the `useEvents` store (date-range phrases are noted on the event for now).
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

## Realtime test plan

1. Open the planner in two browser windows with the same signed-in Supabase user.
2. Add/update/delete an event in one window; the other should reflect the change nearly instantly via realtime merges.
3. Toggle offline/logged-out mode: without a Supabase session, local create/update/delete still work from localStorage.
