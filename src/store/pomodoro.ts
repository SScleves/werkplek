import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db, uid, type PomodoroType } from '../db/db'

interface Durations {
  work: number
  short: number
  long: number
  longEvery: number
}

interface PomodoroState {
  durations: Durations
  mode: PomodoroType
  remaining: number // seconds (display value)
  endsAt: number | null // wall-clock end time while running — survives tab throttling
  running: boolean
  taskId: string | null
  workSessions: number // completed work sessions since last long break
  justFinished: PomodoroType | null // set when a session completes, for the UI

  configure: (d: Durations) => void
  selectTask: (id: string | null) => void
  setMode: (m: PomodoroType) => void
  start: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  skip: () => void
  tick: () => void
  clearJustFinished: () => void
}

const DEFAULTS: Durations = { work: 25, short: 5, long: 15, longEvery: 4 }

const durationFor = (mode: PomodoroType, d: Durations) =>
  (mode === 'work' ? d.work : mode === 'short' ? d.short : d.long) * 60

export const usePomodoro = create<PomodoroState>()(
  persist(
    (set, get) => ({
  durations: DEFAULTS,
  mode: 'work',
  remaining: DEFAULTS.work * 60,
  endsAt: null,
  running: false,
  taskId: null,
  workSessions: 0,
  justFinished: null,

  configure: (d) =>
    set((s) => {
      const next: Partial<PomodoroState> = { durations: d }
      // If idle, keep the displayed time in sync with new settings
      if (!s.running && s.remaining === durationFor(s.mode, s.durations))
        next.remaining = durationFor(s.mode, d)
      return next
    }),

  selectTask: (id) => set({ taskId: id }),

  setMode: (m) =>
    set((s) => ({
      mode: m,
      remaining: durationFor(m, s.durations),
      endsAt: null,
      running: false,
    })),

  start: () =>
    set((s) => {
      const remaining =
        s.remaining > 0 ? s.remaining : durationFor(s.mode, s.durations)
      return { running: true, remaining, endsAt: Date.now() + remaining * 1000 }
    }),

  pause: () =>
    set((s) => ({
      running: false,
      remaining: s.endsAt
        ? Math.max(0, Math.round((s.endsAt - Date.now()) / 1000))
        : s.remaining,
      endsAt: null,
    })),

  toggle: () => (get().running ? get().pause() : get().start()),

  reset: () =>
    set((s) => ({
      remaining: durationFor(s.mode, s.durations),
      endsAt: null,
      running: false,
    })),

  skip: () => {
    advance(get(), set, false)
  },

  // Recomputes from the wall clock, so a throttled background tab catches up
  // the instant the next tick fires instead of drifting.
  tick: () => {
    const s = get()
    if (!s.running || !s.endsAt) return
    const remaining = Math.max(0, Math.round((s.endsAt - Date.now()) / 1000))
    if (remaining <= 0) {
      advance(s, set, true)
    } else if (remaining !== s.remaining) {
      set({ remaining })
    }
  },

  clearJustFinished: () => set({ justFinished: null }),
    }),
    {
      name: 'flowdeck-pomodoro',
      // Persist the session itself; durations re-sync from settings on load
      partialize: (s) => ({
        mode: s.mode,
        remaining: s.remaining,
        endsAt: s.endsAt,
        running: s.running,
        taskId: s.taskId,
        workSessions: s.workSessions,
      }),
    },
  ),
)

/** Advance to the next mode. `completed` = the timer actually ran out. */
function advance(
  s: PomodoroState,
  set: (partial: Partial<PomodoroState>) => void,
  completed: boolean,
) {
  const finishedMode = s.mode
  let workSessions = s.workSessions
  let nextMode: PomodoroType

  if (finishedMode === 'work') {
    if (completed) {
      workSessions += 1
      logWorkSession(s.taskId)
    }
    nextMode =
      workSessions > 0 && workSessions % s.durations.longEvery === 0
        ? 'long'
        : 'short'
  } else {
    nextMode = 'work'
  }

  set({
    mode: nextMode,
    remaining: durationFor(nextMode, s.durations),
    endsAt: null,
    running: false,
    workSessions,
    justFinished: completed ? finishedMode : null,
  })
}

async function logWorkSession(taskId: string | null) {
  await db.pomodoros.add({
    id: uid(),
    taskId,
    type: 'work',
    startedAt: Date.now(),
    endedAt: Date.now(),
    completed: true,
  })
  if (taskId) {
    const t = await db.tasks.get(taskId)
    if (t) await db.tasks.update(taskId, { pomodorosDone: t.pomodorosDone + 1 })
  }
}

export const fmtTime = (sec: number): string => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export { durationFor }
