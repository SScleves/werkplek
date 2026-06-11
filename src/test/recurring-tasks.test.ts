import { describe, it, expect } from 'vitest'
import { nextDueDate } from '../lib/tasks'
import { todayStr, addDaysStr } from '../lib/date'

describe('nextDueDate', () => {
  const today = todayStr()

  it('daily task due today moves to tomorrow', () => {
    expect(nextDueDate(today, 'daily')).toBe(addDaysStr(today, 1))
  })

  it('weekly task due today moves a week ahead', () => {
    expect(nextDueDate(today, 'weekly')).toBe(addDaysStr(today, 7))
  })

  it('overdue daily task skips ahead to tomorrow, not the past', () => {
    const lastWeek = addDaysStr(today, -7)
    expect(nextDueDate(lastWeek, 'daily')).toBe(addDaysStr(today, 1))
  })

  it('overdue weekly task lands on the next future occurrence on the same weekday', () => {
    const threeWeeksAgo = addDaysStr(today, -21)
    expect(nextDueDate(threeWeeksAgo, 'weekly')).toBe(addDaysStr(today, 7))
  })

  it('future-dated task moves one interval further out', () => {
    const nextWeek = addDaysStr(today, 7)
    expect(nextDueDate(nextWeek, 'weekly')).toBe(addDaysStr(today, 14))
  })
})
