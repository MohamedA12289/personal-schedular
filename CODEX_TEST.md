Codex test: if you see this file in GitHub, pushing works.

Guidance for future edits:

- Keep `app/page.tsx` changes minimal and avoid removing tabs, chat, notifications, or storage features.
- Use feature branches and open PRs against `feature/initial-setup`; do not force-push.
- Favor modular components under `app/components/` and shared logic in `app/lib/` or hooks.
- Prefer extending parsing in `app/lib/nlp.ts` without breaking existing phrases; manual add panels should flow through `useEvents`.
