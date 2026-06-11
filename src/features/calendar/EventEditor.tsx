import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal, Button, inputClass, useAutoFocus } from '../../components/ui'
import {
  createEvent,
  updateEvent,
  deleteEvent,
  EVENT_COLORS,
  RECURRENCE_LABELS,
  eventDate,
  eventTime,
  eventEndTime,
} from './events'
import type { CalendarEvent, Recurrence } from '../../db/db'

export function EventEditor({
  open,
  onClose,
  event,
  defaultDate,
  defaultTime,
}: {
  open: boolean
  onClose: () => void
  event?: CalendarEvent | null
  defaultDate?: string
  defaultTime?: string // 'HH:mm'
}) {
  const titleRef = useAutoFocus<HTMLInputElement>(open)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [color, setColor] = useState(EVENT_COLORS[0])
  const [notes, setNotes] = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [recurUntil, setRecurUntil] = useState('')

  /* eslint-disable react-hooks/set-state-in-effect -- intentional: seed form state when the modal (re)opens */
  useEffect(() => {
    if (!open) return
    setTitle(event?.title ?? '')
    setDate(event ? eventDate(event) : defaultDate ?? '')
    setAllDay(event?.allDay ?? false)
    setStartTime(event ? eventTime(event) : defaultTime ?? '09:00')
    setEndTime(
      event
        ? eventEndTime(event)
        : defaultTime
          ? `${String(Math.min(23, Number(defaultTime.slice(0, 2)) + 1)).padStart(2, '0')}:${defaultTime.slice(3)}`
          : '10:00',
    )
    setColor(event?.color ?? EVENT_COLORS[0])
    setNotes(event?.notes ?? '')
    setRecurrence(event?.recurrence ?? 'none')
    setRecurUntil(event?.recurUntil ?? '')
  }, [open, event, defaultDate, defaultTime])
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    if (!date) return
    const payload = {
      title,
      date,
      allDay,
      startTime,
      endTime,
      color,
      notes,
      recurrence,
      recurUntil: recurUntil || null,
    }
    if (event) await updateEvent(event.id, payload)
    else await createEvent(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event ? 'Edit event' : 'New event'}
      width="max-w-md"
    >
      <div className="flex flex-col gap-3">
        <input
          ref={titleRef}
          className={`${inputClass} text-base font-medium`}
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
            Date
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            All day
          </label>
        </div>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
              Start
              <input
                type="time"
                className={inputClass}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
              End
              <input
                type="time"
                className={inputClass}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
            Repeat
            <select
              className={inputClass}
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
            >
              {(
                Object.keys(RECURRENCE_LABELS) as Recurrence[]
              ).map((r) => (
                <option key={r} value={r}>
                  {RECURRENCE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          {recurrence !== 'none' && (
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
              Until (optional)
              <input
                type="date"
                className={inputClass}
                value={recurUntil}
                min={date}
                onChange={(e) => setRecurUntil(e.target.value)}
              />
            </label>
          )}
        </div>

        <textarea
          className={`${inputClass} min-h-16 resize-y`}
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-1.5">
          {EVENT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full transition ${
                color === c
                  ? 'ring-2 ring-[var(--color-text)] ring-offset-2 ring-offset-[var(--color-surface)]'
                  : ''
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between">
          {event ? (
            <Button
              variant="ghost"
              onClick={async () => {
                await deleteEvent(event.id)
                onClose()
              }}
            >
              <Trash2 size={15} /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!date}>
              {event ? 'Save' : 'Add event'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
