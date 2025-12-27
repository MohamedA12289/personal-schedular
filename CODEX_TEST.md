Codex test: if you see this file in GitHub, pushing works.

Guidance for future edits:

- Keep `app/page.tsx` changes minimal and avoid removing tabs, chat, notifications, or storage features.
- Use feature branches and open PRs against `feature/initial-setup`; do not force-push.
- Favor modular components under `app/components/` and shared logic in `app/lib/` or hooks.
- Prefer extending parsing in `app/lib/nlp.ts` without breaking existing phrases; manual add panels should flow through `useEvents`.

Recent changes to remember:

- Manual event form lives near the chat input and defaults the end time to one hour after the start when left empty.
- `parseNaturalEvent` understands slang like `tmrw`, `tommorow`, `tonite`, month/weekday abbreviations, and simple ranges
  such as `math class from 4 to 6 from dec 25 to feb 24` (stored as a single event with a range note).
- Calendar supports Month/Week/Year modes; selecting a date in the Year view updates the selected day for other modes.

Parser examples (reference expectations):
- "math test on dec 30th at 2 pm" → start on Dec 30 at 14:00.
- "gym 6-7 tmrw" → tomorrow 18:00–19:00.
- "tonite party at 9" → today 21:00.
- "math class from 4 to 6 from dec 25 to feb 24" → single event on Dec 25, 16:00–18:00, notes include the range text.

Year view checks:
- Switching modes between Month, Week, and Year keeps event badges accurate.
- Selecting Dec 25 from the Year grid highlights it when returning to Month or Day views.

Realtime sync notes:
- Supabase env vars are optional; when present with a signed-in session, `useEvents` merges cloud rows and listens to
  `postgres_changes` on `public.events` filtered by `user_id`.
- Publications: add `events` to the `supabase_realtime` publication; RLS must limit access to the current user.
- Local-only mode remains the fallback if Supabase is unreachable or no session token exists.

Tasks per-day checks:
- In the Tasks tab, new items default to the currently selected day; toggle between Selected Day and All to verify scoping.
- Set an optional due date in the add form; edit titles inline by clicking them (Enter to save, Esc to cancel).
- Update due dates via the date picker in each row; completion toggle and delete should persist after refresh.
- Reorder tasks by dragging the handle (☰) within the visible list; drop to new position and refresh to confirm order persistence.

Backup export/import checks:
- Open Settings → Backup, click Export JSON to download events + tasks payload (version 1).
- Use Import (Merge) on that file; verify event/task counts remain and no duplicates are added.
- Use Import (Replace) on an edited file; ensure existing events/tasks are overwritten with the file contents.
- Invalid JSON should surface a friendly inline message instead of crashing.

PWA install + connectivity checks:
- Load the app in Chrome; when the browser surfaces the install prompt, the header should show an "Install app" pill.
- Click Install app, accept the prompt, and confirm the button disappears afterward.
- Toggle network offline in DevTools and refresh: header pill switches to Offline and the app shell still renders.
- Restore connectivity; pill returns to Online automatically.
