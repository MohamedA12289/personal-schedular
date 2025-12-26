This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# My personal shiesty planner

## Getting Started
A local-first, PassivePilot-inspired planner built with Next.js + TypeScript. It keeps everything on your
device: calendar/day/list views, natural-language chat input, manual add forms, notifications, and manual
backup/restore. No external APIs or cloud services are required.

First, run the development server:
## Quickstart

```bash
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
Then open http://localhost:3000.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
Optional checks:

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
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

## Learn More
## Using the modular components

To learn more about Next.js, take a look at the following resources:
- Switch views with `TabNavigation` plus `CalendarView`, `DayView`, `TasksView`, and `SettingsView`.
- Add events through `EventChatPanel`, the manual form, or wire `ChatInput` with `parseNaturalEvent` to feed the `useEvents` store (date-range phrases are noted on the event for now).
- Export/Import via `SettingsView` to download a JSON backup or restore one (import replaces local data).
- Install as a PWA: Safari on iPhone → **Add to Home Screen**; desktop browsers → **Install** from the address bar.

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
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

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
## Notifications

## Deploy on Vercel
- Enable notifications in Settings. The app will request permission once and schedule local reminders while
  it is open or running as an installed PWA.
- No external services are used; reminders stay on the device.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
## Realtime test plan

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
1. Open the planner in two browser windows with the same signed-in Supabase user.
2. Add/update/delete an event in one window; the other should reflect the change nearly instantly via realtime merges.
3. Toggle offline/logged-out mode: without a Supabase session, local create/update/delete still work from localStorage.