This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# My Schedule

## Getting Started
A PassivePilot-inspired personal scheduling app built with Next.js + TypeScript. Everything runs locally in the browser with no external APIs or servers.

First, run the development server:
## Getting Started

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
Then open http://localhost:3000 to view the app. It is mobile-first and adapts to wider screens.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
## Core features
- Calendar and Day views stay in sync with a shared selected date when composed together.
- Natural-language chat bar for adding events (e.g., "math test at 7 pm Thursday").
- Local event store using `localStorage` (no external APIs).
- Manual export/import of data for cross-device sync (JSON backup files).
- Installable PWA with manifest and service worker so you can add it to your phone or desktop.

## Learn More
## Using the modular components
- Switch views: use `TabNavigation` with `CalendarView`, `DayView`, `TasksView`, and `SettingsView` to build a shell.
- Add events: drop in `EventChatPanel` or wire `ChatInput` with `parseNaturalEvent` to append to the `useEvents` store.
- Export/Import: render `SettingsView` to download a backup JSON file or import a saved one (import replaces local data).
- Install as PWA: on iPhone use Safari’s **Add to Home Screen**; on desktop browsers click the **Install** option in the address bar.

To learn more about Next.js, take a look at the following resources:
Example composition (keep `app/page.tsx` unchanged if you prefer the simple shell):

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
```tsx
import { SchedulerShell } from "@/app/components/scheduler-shell";

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
export default function Page() {
  return <SchedulerShell />;
}
```

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## Notifications
- Enable notifications in Settings. The app will request permission once and schedule local reminders while it is open or running as an installed PWA.
- No external services are used; reminders stay on the device.