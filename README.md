# My Schedule

A PassivePilot-inspired personal scheduling app built with Next.js + TypeScript. Everything runs locally in the browser with no external APIs or servers.

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 to view the app. It is mobile-first and adapts to wider screens.

## Core features
- Calendar and Day tabs stay in sync with a shared selected date.
- Natural-language chat bar for adding events (e.g., "math test at 7 pm Thursday").
- Local event store using `localStorage` with reminder support.
- Manual export/import of data for cross-device sync (JSON backup files).
- Installable PWA with manifest and service worker so you can add it to your phone or desktop.

## Using the app
- Switch views: use the Calendar and Day tabs to move between month/week and timeline layouts.
- Add events: type a sentence in the chat bar (bottom) and press Enter or Add.
- Set reminders: open the Day view and choose a reminder offset on each event.
- Export/Import: open Settings to download a backup JSON file or import a saved one (import replaces local data).
- Install as PWA: on iPhone use Safari’s **Add to Home Screen**; on desktop browsers click the **Install** option in the address bar.

## Notifications
- Enable notifications in Settings. The app will request permission once and schedule local reminders while it is open or running as an installed PWA.
- No external services are used; reminders stay on the device.
