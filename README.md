# Werkplek

Your personal command center — a local-first productivity web app. Everything
lives in your browser (IndexedDB); there is no server and no account.

## Modules

- **Dashboard** — today's tasks, schedule, focus count, Dutch streak, and quick
  capture to your journal.
- **Todos** — quick-add, project filters, and Overdue / Today / Upcoming buckets.
- **Boards** — per-project Kanban with drag-and-drop and editable columns.
- **Calendar** — month view plus a week view with an hour grid; tasks show up
  by due date alongside (optionally recurring) events.
- **Notes** — markdown with live preview, tags, full-text search, `[[wiki links]]`
  and backlinks, plus an auto-created **daily journal**.
- **Focus** — a Pomodoro timer (25/5/15, configurable) that attaches to a task,
  chimes + notifies, and offers a **Dutch break** when a session ends.
- **Dutch** — a beginner vocabulary game with three modes (flashcard quiz,
  type-the-translation, word match), native pronunciation (browser TTS),
  spaced repetition, streaks, XP, and a manageable/importable deck.

Tasks can repeat (daily/weekly/monthly) — completing a recurring task
reschedules it to the next occurrence. Deleting a task offers an Undo.
A running pomodoro survives page refreshes.

The same **Task** is shared everywhere: a todo is also a Kanban card and a
calendar entry. Edit it in one place, it updates in all.

## Keyboard

- **⌘K / Ctrl+K** — command palette (jump anywhere, create note/journal, start focus)

## Run it

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build to dist/
npm test         # run the smoke tests
```

## Your data

Everything is stored locally in this browser. Use **Settings → Data → Export**
to download a JSON backup, and **Import** to restore it (also handy for moving
between browsers/machines).

## Stack

React + TypeScript · Vite · Tailwind CSS v4 · Dexie (IndexedDB) · dnd-kit ·
react-markdown · date-fns · Zustand.
