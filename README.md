This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# My personal shiesty planner

## Getting Started
A local-first, PassivePilot-inspired planner built with Next.js + TypeScript. It keeps everything on your
device: calendar/day/list views, natural-language chat input, notifications, and manual backup/restore.
No external APIs or cloud services are required.

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

## Learn More
- **Views:** Calendar (month/week), Day timeline with "Now" indicator, Tasks/List, Settings.
- **Natural language chat:** understands phrases like `math test at 7 pm Thursday`, `tmrw 3pm dentist`,
  `this evening gym`, `in 2 hours finish report`, `after lunch sync`.
- **Local-first data:** events stay in `localStorage` so they persist offline and across reloads.
- **Reminders:** enable notifications in Settings to schedule local reminders (device/PWA must be open or
  installed for best results).
- **Manual sync:** Export to a JSON backup file and Import it on another device to transfer data.
- **PWA-ready:** manifest, icons, and service worker so you can install on mobile (Add to Home Screen) or
  desktop browsers (Install app).

To learn more about Next.js, take a look at the following resources:
## Using the modular components

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- Switch views with `TabNavigation` plus `CalendarView`, `DayView`, `TasksView`, and `SettingsView`.
- Add events through `EventChatPanel` or wire `ChatInput` with `parseNaturalEvent` to feed the `useEvents` store.
- Export/Import via `SettingsView` to download a JSON backup or restore one (import replaces local data).
- Install as a PWA: Safari on iPhone → **Add to Home Screen**; desktop browsers → **Install** from the address bar.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
Example composition (keep `app/page.tsx` unchanged if you prefer the existing shell):

## Deploy on Vercel
```tsx
import { SchedulerShell } from "@/app/components/scheduler-shell";

export default function Page() {
  return <SchedulerShell />;
}
```

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
## Notifications

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
- Enable notifications in Settings. The app will request permission once and schedule local reminders while
  it is open or running as an installed PWA.
- No external services are used; reminders stay on the device.