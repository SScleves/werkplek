import { useEffect, useMemo, useRef } from 'react'
import { isSameDay, format } from 'date-fns'
import type { CalendarEvent, Task, Project } from '../../db/db'
import { toDateStr } from '../../lib/date'
import { expandOccurrences, eventTime } from './events'

const HOUR_PX = 52

const minutesOf = (hhmm: string) =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

export function WeekGrid({
  days,
  events,
  tasks,
  projectColor,
  onEventClick,
  onTaskClick,
  onSlotClick,
}: {
  days: Date[]
  events: CalendarEvent[]
  tasks: Task[]
  projectColor: Record<string, Project['color']>
  onEventClick: (e: CalendarEvent) => void
  onTaskClick: (t: Task) => void
  onSlotClick: (date: string, time: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Start the day view around 07:00
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 7 * HOUR_PX })
  }, [])

  const byDay = useMemo(() => {
    return days.map((day) => {
      const ds = toDateStr(day)
      const timed = events.filter(
        (e) => !e.allDay && expandOccurrences(e, ds, ds).length > 0,
      )
      const allDay = events.filter(
        (e) => e.allDay && expandOccurrences(e, ds, ds).length > 0,
      )
      const dayTasks = tasks.filter((t) => t.dueDate === ds)
      return { day, ds, timed, allDay, dayTasks }
    })
  }, [days, events, tasks])

  const now = new Date()
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_PX

  return (
    <div className="mx-8 mb-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--color-border)]">
      {/* Day headers */}
      <div className="grid shrink-0 grid-cols-[3.5rem_repeat(7,1fr)] border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div />
        {byDay.map(({ day, ds }) => {
          const today = isSameDay(day, now)
          return (
            <div
              key={ds}
              className="flex items-center gap-1.5 border-l border-[var(--color-border)] px-2 py-1.5"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                {format(day, 'EEE')}
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                  today
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text)]'
                }`}
              >
                {format(day, 'd')}
              </span>
            </div>
          )
        })}
      </div>

      {/* All-day / tasks strip */}
      <div className="grid shrink-0 grid-cols-[3.5rem_repeat(7,1fr)] border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="px-1 py-1 text-right text-[10px] text-[var(--color-muted)]">
          all-day
        </div>
        {byDay.map(({ ds, allDay, dayTasks }) => (
          <div
            key={ds}
            className="flex min-h-8 flex-col gap-0.5 border-l border-[var(--color-border)] p-1"
          >
            {allDay.map((e) => (
              <button
                key={e.id}
                onClick={() => onEventClick(e)}
                className="truncate rounded px-1.5 py-0.5 text-left text-[11px] hover:brightness-95"
                style={{ background: `${e.color}22`, color: e.color }}
              >
                {e.title}
              </button>
            ))}
            {dayTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => onTaskClick(t)}
                className="flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] hover:bg-[var(--color-surface-2)]"
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
        ))}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div
          className="grid grid-cols-[3.5rem_repeat(7,1fr)]"
          style={{ height: 24 * HOUR_PX }}
        >
          {/* Hour labels */}
          <div className="relative">
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className="absolute right-1.5 -translate-y-1/2 text-[10px] text-[var(--color-muted)]"
                style={{ top: h * HOUR_PX }}
              >
                {h > 0 && format(new Date(2000, 0, 1, h), 'HH:00')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {byDay.map(({ day, ds, timed }) => {
            const today = isSameDay(day, now)
            return (
              <div
                key={ds}
                className={`relative border-l border-[var(--color-border)] ${
                  today ? 'bg-[var(--color-accent-soft)]/20' : ''
                }`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const y = e.clientY - rect.top
                  const hour = Math.max(
                    0,
                    Math.min(23, Math.floor(y / HOUR_PX)),
                  )
                  onSlotClick(ds, `${String(hour).padStart(2, '0')}:00`)
                }}
              >
                {/* hour lines */}
                {Array.from({ length: 24 }).map((_, h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-[var(--color-border)]/60"
                    style={{ top: h * HOUR_PX }}
                  />
                ))}

                {/* now line */}
                {today && (
                  <div
                    className="absolute inset-x-0 z-10 flex items-center"
                    style={{ top: nowTop }}
                  >
                    <span className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                    <span className="h-px flex-1 bg-red-500" />
                  </div>
                )}

                {/* events */}
                {timed.map((e) => {
                  const startMin = minutesOf(eventTime(e))
                  const endMin = Math.max(
                    startMin + 20,
                    minutesOf(e.end.slice(11, 16)),
                  )
                  return (
                    <button
                      key={e.id}
                      onClick={(ev) => {
                        ev.stopPropagation()
                        onEventClick(e)
                      }}
                      className="absolute inset-x-0.5 z-[5] overflow-hidden rounded-md border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-tight hover:brightness-95"
                      style={{
                        top: (startMin / 60) * HOUR_PX,
                        height: ((endMin - startMin) / 60) * HOUR_PX,
                        background: `${e.color}22`,
                        borderColor: e.color,
                        color: e.color,
                      }}
                    >
                      <span className="font-semibold">{eventTime(e)}</span>{' '}
                      {e.title}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
