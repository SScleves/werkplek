import { describe, it, expect } from 'vitest'
import { expandOccurrences } from '../features/calendar/events'
import type { CalendarEvent } from '../db/db'

const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'e1',
  title: 'Test',
  start: '2026-06-01T09:00',
  end: '2026-06-01T10:00',
  allDay: false,
  color: '#000',
  notes: '',
  recurrence: 'none',
  recurUntil: null,
  ...over,
})

describe('expandOccurrences', () => {
  it('non-recurring event appears only on its date within range', () => {
    const e = ev({ recurrence: 'none' })
    expect(expandOccurrences(e, '2026-06-01', '2026-06-30')).toEqual(['2026-06-01'])
    expect(expandOccurrences(e, '2026-06-02', '2026-06-30')).toEqual([])
  })

  it('daily recurrence fills every day in range', () => {
    const e = ev({ recurrence: 'daily' })
    expect(expandOccurrences(e, '2026-06-01', '2026-06-03')).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
    ])
  })

  it('weekly recurrence lands on the same weekday', () => {
    const e = ev({ recurrence: 'weekly' })
    expect(expandOccurrences(e, '2026-06-01', '2026-06-22')).toEqual([
      '2026-06-01',
      '2026-06-08',
      '2026-06-15',
      '2026-06-22',
    ])
  })

  it('monthly recurrence lands on the same day of month', () => {
    const e = ev({ recurrence: 'monthly' })
    expect(expandOccurrences(e, '2026-06-01', '2026-09-30')).toEqual([
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
      '2026-09-01',
    ])
  })

  it('respects recurUntil', () => {
    const e = ev({ recurrence: 'daily', recurUntil: '2026-06-02' })
    expect(expandOccurrences(e, '2026-06-01', '2026-06-30')).toEqual([
      '2026-06-01',
      '2026-06-02',
    ])
  })
})
