import { parseISO, addDays, addMonths } from 'date-fns'
import { db, uid, type CalendarEvent, type Recurrence } from '../../db/db'
import { toDateStr } from '../../lib/date'

export const EVENT_COLORS = [
  '#4f6ef7',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
]

export interface NewEvent {
  title: string
  date: string // 'YYYY-MM-DD'
  allDay: boolean
  startTime?: string // 'HH:mm'
  endTime?: string
  color: string
  notes?: string
  recurrence?: Recurrence
  recurUntil?: string | null
}

function composeStart(date: string, allDay: boolean, time?: string): string {
  if (allDay) return `${date}T00:00`
  return `${date}T${time || '09:00'}`
}

export async function createEvent(input: NewEvent): Promise<CalendarEvent> {
  const start = composeStart(input.date, input.allDay, input.startTime)
  const end = input.allDay
    ? `${input.date}T23:59`
    : `${input.date}T${input.endTime || input.startTime || '10:00'}`
  const ev: CalendarEvent = {
    id: uid(),
    title: input.title.trim() || 'Untitled',
    start,
    end,
    allDay: input.allDay,
    color: input.color,
    notes: input.notes ?? '',
    recurrence: input.recurrence ?? 'none',
    recurUntil: input.recurUntil ?? null,
  }
  await db.events.add(ev)
  return ev
}

export async function updateEvent(
  id: string,
  input: NewEvent,
): Promise<void> {
  const start = composeStart(input.date, input.allDay, input.startTime)
  const end = input.allDay
    ? `${input.date}T23:59`
    : `${input.date}T${input.endTime || input.startTime || '10:00'}`
  await db.events.update(id, {
    title: input.title.trim() || 'Untitled',
    start,
    end,
    allDay: input.allDay,
    color: input.color,
    notes: input.notes ?? '',
    recurrence: input.recurrence ?? 'none',
    recurUntil: input.recurUntil ?? null,
  })
}

export async function deleteEvent(id: string): Promise<void> {
  await db.events.delete(id)
}

export const eventDate = (e: CalendarEvent): string => e.start.slice(0, 10)
export const eventTime = (e: CalendarEvent): string => e.start.slice(11, 16)
export const eventEndTime = (e: CalendarEvent): string => e.end.slice(11, 16)

/** Dates (YYYY-MM-DD) on which this event occurs within [fromStr, toStr]. */
export function expandOccurrences(
  e: CalendarEvent,
  fromStr: string,
  toStr: string,
): string[] {
  const base = eventDate(e)
  const rec = e.recurrence ?? 'none'
  if (rec === 'none')
    return base >= fromStr && base <= toStr ? [base] : []

  const until = e.recurUntil ?? null
  const out: string[] = []
  let d = parseISO(base)
  let guard = 0
  while (guard++ < 1200) {
    const ds = toDateStr(d)
    if (ds > toStr) break
    if (until && ds > until) break
    if (ds >= fromStr) out.push(ds)
    d =
      rec === 'daily'
        ? addDays(d, 1)
        : rec === 'weekly'
          ? addDays(d, 7)
          : addMonths(d, 1)
  }
  return out
}

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: 'Does not repeat',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}
