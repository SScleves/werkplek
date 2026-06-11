import { useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  addWeeks,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui'
import { EventEditor } from '../features/calendar/EventEditor'
import { WeekGrid } from '../features/calendar/WeekGrid'
import { TaskEditor } from '../features/tasks/TaskEditor'
import { useTasks, useEvents, useProjects } from '../hooks'
import { toDateStr } from '../lib/date'
import { eventTime, expandOccurrences } from '../features/calendar/events'
import type { Task, CalendarEvent } from '../db/db'

type View = 'month' | 'week'

export function CalendarPage() {
  const tasks = useTasks()
  const events = useEvents()
  const projects = useProjects()
  const [cursor, setCursor] = useState(new Date())
  const [view, setView] = useState<View>('month')

  const [eventEditing, setEventEditing] = useState<CalendarEvent | null>(null)
  const [eventOpen, setEventOpen] = useState(false)
  const [eventDefaultDate, setEventDefaultDate] = useState<string>()
  const [eventDefaultTime, setEventDefaultTime] = useState<string>()
  const [taskEditing, setTaskEditing] = useState<Task | null>(null)
  const [taskOpen, setTaskOpen] = useState(false)

  const projectColor = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.color])),
    [projects],
  )

  const days = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
      const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    }
    const start = startOfWeek(cursor, { weekStartsOn: 1 })
    const end = endOfWeek(cursor, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor, view])

  // Map of 'YYYY-MM-DD' -> items (recurring events expanded over the range)
  const byDay = useMemo(() => {
    const map: Record<string, { tasks: Task[]; events: CalendarEvent[] }> = {}
    const get = (d: string) => (map[d] ??= { tasks: [], events: [] })
    const from = toDateStr(days[0])
    const to = toDateStr(days[days.length - 1])
    for (const t of tasks) if (t.dueDate) get(t.dueDate).tasks.push(t)
    for (const e of events)
      for (const occ of expandOccurrences(e, from, to)) get(occ).events.push(e)
    for (const k in map)
      map[k].events.sort((a, b) =>
        a.allDay === b.allDay ? a.start.localeCompare(b.start) : a.allDay ? -1 : 1,
      )
    return map
  }, [tasks, events, days])

  const move = (dir: number) =>
    setCursor((c) => (view === 'month' ? addMonths(c, dir) : addWeeks(c, dir)))

  const openEvent = (e: CalendarEvent | null, date?: string, time?: string) => {
    setEventEditing(e)
    setEventDefaultDate(date)
    setEventDefaultTime(time)
    setEventOpen(true)
  }
  const openTask = (t: Task) => {
    setTaskEditing(t)
    setTaskOpen(true)
  }

  const title =
    view === 'month'
      ? format(cursor, 'MMMM yyyy')
      : `${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d, yyyy')}`

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Calendar"
        actions={
          <>
            <div className="flex rounded-lg bg-[var(--color-surface-2)] p-1">
              {(['month', 'week'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                    view === v
                      ? 'bg-[var(--color-surface)] shadow-sm'
                      : 'text-[var(--color-muted)]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button
              variant="primary"
              onClick={() => openEvent(null, toDateStr(new Date()))}
            >
              <Plus size={16} /> Event
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-8 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => move(-1)}
            className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => move(1)}
            className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <Button variant="subtle" onClick={() => setCursor(new Date())}>
          Today
        </Button>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>

      {view === 'week' ? (
        <WeekGrid
          days={days}
          events={events}
          tasks={tasks}
          projectColor={projectColor}
          onEventClick={(e) => openEvent(e)}
          onTaskClick={openTask}
          onSlotClick={(ds, time) => openEvent(null, ds, time)}
        />
      ) : (
        <>
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-[var(--color-border)] px-8">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div
            key={d}
            className="py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="mx-8 mb-6 grid flex-1 auto-rows-fr grid-cols-7 gap-px overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-border)]">
        {days.map((day) => {
          const ds = toDateStr(day)
          const items = byDay[ds]
          const inMonth = isSameMonth(day, cursor)
          const today = isSameDay(day, new Date())
          return (
            <div
              key={ds}
              onClick={() => openEvent(null, ds)}
              className={`group min-h-24 cursor-pointer bg-[var(--color-surface)] p-1.5 transition hover:bg-[var(--color-surface-2)] ${
                inMonth ? '' : 'opacity-40'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    today
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-muted)]'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                <Plus
                  size={13}
                  className="text-[var(--color-muted)] opacity-0 transition group-hover:opacity-100"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                {items?.events.map((e) => (
                  <button
                    key={e.id}
                    onClick={(ev) => {
                      ev.stopPropagation()
                      openEvent(e)
                    }}
                    className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] hover:brightness-95"
                    style={{ background: `${e.color}22`, color: e.color }}
                  >
                    {!e.allDay && (
                      <span className="shrink-0 font-medium opacity-80">
                        {eventTime(e)}
                      </span>
                    )}
                    <span className="truncate">{e.title}</span>
                    {e.recurrence && e.recurrence !== 'none' && (
                      <Repeat size={9} className="shrink-0 opacity-70" />
                    )}
                  </button>
                ))}
                {items?.tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={(ev) => {
                      ev.stopPropagation()
                      openTask(t)
                    }}
                    className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background: projectColor[t.projectId] ?? 'var(--color-muted)',
                      }}
                    />
                    <span
                      className={`truncate ${
                        t.done ? 'text-[var(--color-muted)] line-through' : ''
                      }`}
                    >
                      {t.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
        </>
      )}

      <EventEditor
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        event={eventEditing}
        defaultDate={eventDefaultDate}
        defaultTime={eventDefaultTime}
      />
      <TaskEditor
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        task={taskEditing}
      />
    </div>
  )
}
