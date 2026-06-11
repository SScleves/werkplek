import { db, uid, DEFAULT_SETTINGS, type Project, type Task } from './db'
import { VOCAB_SEED } from './vocabSeed'
import { todayStr, addDaysStr } from '../lib/date'

const defaultColumns = () => [
  { id: uid(), name: 'Backlog' },
  { id: uid(), name: 'To Do' },
  { id: uid(), name: 'In Progress' },
  { id: uid(), name: 'Done', isDone: true },
]

export async function ensureSeeded(): Promise<void> {
  // Settings
  const settings = await db.settings.get('settings')
  if (!settings) await db.settings.put(DEFAULT_SETTINGS)

  // Game stats singleton
  const stats = await db.gameStats.get('stats')
  if (!stats)
    await db.gameStats.put({
      id: 'stats',
      streak: 0,
      bestStreak: 0,
      lastPlayed: null,
      totalReviews: 0,
      xp: 0,
    })

  // Vocab — only seed if empty
  const vocabCount = await db.vocab.count()
  if (vocabCount === 0) {
    const today = todayStr()
    await db.vocab.bulkAdd(
      VOCAB_SEED.map((w) => ({
        id: uid(),
        dutch: w.dutch,
        english: w.english,
        theme: w.theme,
        example: w.example,
        ease: 2.5,
        intervalDays: 0,
        dueDate: today,
        reps: 0,
        lapses: 0,
        lastReviewed: null,
      })),
    )
  }

  // Projects + a few starter tasks — only on a truly fresh database
  const projectCount = await db.projects.count()
  if (projectCount === 0) {
    const inbox: Project = {
      id: uid(),
      name: 'Inbox',
      color: '#4f6ef7',
      columns: defaultColumns(),
      order: 0,
      createdAt: Date.now(),
    }
    const personal: Project = {
      id: uid(),
      name: 'Personal',
      color: '#10b981',
      columns: defaultColumns(),
      order: 1,
      createdAt: Date.now(),
    }
    await db.projects.bulkAdd([inbox, personal])

    const todo = inbox.columns[1].id
    const starter: Task[] = [
      {
        id: uid(),
        title: 'Welcome to Werkplek 👋 — click to edit me',
        notes: 'This is a shared task: it shows up in Todos, on the Kanban board, and (because it has a due date) on the Calendar.',
        projectId: inbox.id,
        columnId: todo,
        done: false,
        dueDate: todayStr(),
        priority: 'med',
        tags: ['intro'],
        pomodorosDone: 0,
        order: 1000,
        createdAt: Date.now(),
        completedAt: null,
      },
      {
        id: uid(),
        title: 'Take a Dutch break and learn 5 words',
        notes: '',
        projectId: personal.id,
        columnId: personal.columns[1].id,
        done: false,
        dueDate: addDaysStr(todayStr(), 1),
        priority: 'low',
        tags: [],
        pomodorosDone: 0,
        order: 2000,
        createdAt: Date.now(),
        completedAt: null,
      },
    ]
    await db.tasks.bulkAdd(starter)
  }
}
