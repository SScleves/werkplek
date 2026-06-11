import Dexie, { type Table } from 'dexie'

// ---------------------------------------------------------------------------
// Types — the shared Task is the heart of FlowDeck. The same Task object is a
// todo, a kanban card, and (when it has a dueDate) a calendar entry.
// ---------------------------------------------------------------------------

export type Priority = 'low' | 'med' | 'high'

export interface Column {
  id: string
  name: string
  isDone?: boolean // dropping a card here marks the task done
}

export interface Project {
  id: string
  name: string
  color: string
  columns: Column[]
  order: number
  createdAt: number
}

export interface Task {
  id: string
  title: string
  notes: string
  projectId: string
  columnId: string
  done: boolean
  dueDate: string | null // 'YYYY-MM-DD'
  priority: Priority | null
  tags: string[]
  pomodorosDone: number
  order: number
  createdAt: number
  completedAt: number | null
  recurrence?: Recurrence // completing a recurring task reschedules it
}

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO datetime (first occurrence)
  end: string // ISO datetime
  allDay: boolean
  color: string
  notes: string
  recurrence?: Recurrence
  recurUntil?: string | null // 'YYYY-MM-DD' inclusive, or null for forever
}

export interface Note {
  id: string
  title: string
  body: string
  tags: string[]
  journalDate: string | null // 'YYYY-MM-DD' when this note is a daily journal
  pinned: boolean
  createdAt: number
  updatedAt: number
}

export type PomodoroType = 'work' | 'short' | 'long'

export interface PomodoroSession {
  id: string
  taskId: string | null
  type: PomodoroType
  startedAt: number
  endedAt: number | null
  completed: boolean
}

export interface VocabCard {
  id: string
  dutch: string
  english: string
  theme: string
  example?: string
  // light SM-2 style spaced repetition
  ease: number
  intervalDays: number
  dueDate: string // 'YYYY-MM-DD'
  reps: number
  lapses: number
  lastReviewed: number | null
}

export interface GameStats {
  id: 'stats'
  streak: number
  bestStreak: number
  lastPlayed: string | null // 'YYYY-MM-DD'
  totalReviews: number
  xp: number
}

export interface Settings {
  id: 'settings'
  theme: 'light' | 'dark' | 'system'
  pomodoro: { work: number; short: number; long: number; longEvery: number }
  soundOn: boolean
  notificationsOn: boolean
  accent: string
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export class FlowDeckDB extends Dexie {
  projects!: Table<Project, string>
  tasks!: Table<Task, string>
  events!: Table<CalendarEvent, string>
  notes!: Table<Note, string>
  pomodoros!: Table<PomodoroSession, string>
  vocab!: Table<VocabCard, string>
  gameStats!: Table<GameStats, string>
  settings!: Table<Settings, string>

  constructor() {
    super('flowdeck')
    this.version(1).stores({
      projects: 'id, order, createdAt',
      tasks: 'id, projectId, columnId, done, dueDate, order, createdAt',
      events: 'id, start',
      notes: 'id, journalDate, updatedAt, pinned',
      pomodoros: 'id, taskId, startedAt',
      vocab: 'id, theme, dueDate',
      gameStats: 'id',
      settings: 'id',
    })
  }
}

export const db = new FlowDeckDB()

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  theme: 'system',
  pomodoro: { work: 25, short: 5, long: 15, longEvery: 4 },
  soundOn: true,
  notificationsOn: true,
  accent: '#4f6ef7',
}
