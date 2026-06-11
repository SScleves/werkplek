import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus,
  Timer,
  GraduationCap,
  Flame,
  CalendarDays,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Card, Button, inputClass, Empty } from '../components/ui'
import { TaskRow } from '../features/tasks/TaskRow'
import { TaskEditor } from '../features/tasks/TaskEditor'
import { useTasks, useEvents, useProjects, useGameStats } from '../hooks'
import { db, type Task } from '../db/db'
import { createTask } from '../lib/tasks'
import { ensureTodayJournal, updateNote } from '../lib/notes'
import { dueCount } from '../lib/dutch'
import { todayStr, toDateStr, isToday, isOverdue, prettyDateLong } from '../lib/date'
import { eventTime, expandOccurrences } from '../features/calendar/events'

export function Dashboard() {
  const navigate = useNavigate()
  const tasks = useTasks()
  const events = useEvents()
  const projects = useProjects()
  const stats = useGameStats()
  const vocab = useLiveQuery(() => db.vocab.toArray(), [], [])
  const [quick, setQuick] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [capture, setCapture] = useState('')

  const today = todayStr()
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects],
  )

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.done && (isOverdue(t.dueDate) || isToday(t.dueDate)))
        .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')),
    [tasks],
  )

  const todayEvents = useMemo(
    () =>
      events
        .filter((e) => expandOccurrences(e, today, today).length > 0)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [events, today],
  )

  const pomToday = useLiveQuery(async () => {
    const all = await db.pomodoros.toArray()
    return all.filter(
      (p) => p.type === 'work' && toDateStr(new Date(p.startedAt)) === today,
    ).length
  }, [today])

  const addQuick = async () => {
    if (!quick.trim() || !projects[0]) return
    await createTask({
      title: quick,
      projectId: projects[0].id,
      dueDate: today,
    })
    setQuick('')
  }

  const saveCapture = async () => {
    if (!capture.trim()) return
    const id = await ensureTodayJournal()
    const note = await db.notes.get(id)
    const time = new Date().toTimeString().slice(0, 5)
    const body = `${note?.body ?? ''}${note?.body ? '\n\n' : ''}**${time}** — ${capture.trim()}`
    await updateNote(id, { body })
    setCapture('')
    navigate(`/notes/${id}`)
  }

  return (
    <>
      <PageHeader
        title={`${greeting} 👋`}
        subtitle={prettyDateLong(today)}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setEditorOpen(true)
            }}
          >
            <Plus size={16} /> New task
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-8 py-6 lg:grid-cols-3">
        {/* Today's tasks — spans 2 cols */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <h2 className="text-sm font-semibold">Today</h2>
            <button
              onClick={() => navigate('/todos')}
              className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              All todos <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-2">
            {todayTasks.length === 0 ? (
              <Empty
                icon={<Sparkles size={24} />}
                title="Nothing due today"
                hint="You're all caught up. Add a task or take a Dutch break."
              />
            ) : (
              todayTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  project={projectMap[t.projectId]}
                  onClick={() => {
                    setEditing(t)
                    setEditorOpen(true)
                  }}
                />
              ))
            )}
            <div className="mt-1 flex gap-2 px-2">
              <input
                className={inputClass}
                placeholder="Quick add a task for today…"
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addQuick()}
              />
              <Button variant="subtle" onClick={addQuick} disabled={!quick.trim()}>
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Focus */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Timer size={16} />
              </span>
              <h2 className="text-sm font-semibold">Focus</h2>
            </div>
            <p className="text-sm text-[var(--color-muted)]">
              <span className="text-2xl font-semibold text-[var(--color-text)]">
                {pomToday ?? 0}
              </span>{' '}
              sessions today
            </p>
            <Button
              variant="subtle"
              className="mt-3 w-full justify-center"
              onClick={() => navigate('/focus')}
            >
              Start focus session
            </Button>
          </Card>

          {/* Dutch */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <GraduationCap size={16} />
              </span>
              <h2 className="text-sm font-semibold">Dutch</h2>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Flame size={15} className="text-orange-500" />
                <strong>{stats?.streak ?? 0}</strong> streak
              </span>
              <span className="text-[var(--color-muted)]">
                {dueCount(vocab)} due
              </span>
            </div>
            <Button
              variant="subtle"
              className="mt-3 w-full justify-center"
              onClick={() => navigate('/dutch')}
            >
              Practice now
            </Button>
          </Card>
        </div>

        {/* Schedule */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays size={15} /> Today's schedule
            </h2>
            <button
              onClick={() => navigate('/calendar')}
              className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              Calendar <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-3">
            {todayEvents.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-[var(--color-muted)]">
                No events scheduled today.
              </p>
            ) : (
              todayEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                >
                  <span
                    className="h-8 w-1 rounded-full"
                    style={{ background: e.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {e.allDay ? 'All day' : eventTime(e)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick capture */}
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold">Quick capture</h2>
          <p className="mb-3 text-xs text-[var(--color-muted)]">
            Jot a thought — it's saved to today's journal.
          </p>
          <textarea
            className={`${inputClass} min-h-20 resize-none`}
            placeholder="What's on your mind?"
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveCapture()
            }}
          />
          <Button
            variant="primary"
            className="mt-2 w-full justify-center"
            onClick={saveCapture}
            disabled={!capture.trim()}
          >
            Save to journal
          </Button>
        </Card>
      </div>

      <TaskEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        task={editing}
        defaultProjectId={projects[0]?.id}
        defaultDueDate={today}
      />
    </>
  )
}
