import {
  format,
  parseISO,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isToday as dfIsToday,
} from 'date-fns'

/** 'YYYY-MM-DD' for a given Date (local). */
export const toDateStr = (d: Date): string => format(d, 'yyyy-MM-dd')

/** Today as 'YYYY-MM-DD'. */
export const todayStr = (): string => toDateStr(new Date())

/** Parse a 'YYYY-MM-DD' into a local Date at midnight. */
export const fromDateStr = (s: string): Date => parseISO(s)

export const addDaysStr = (s: string, n: number): string =>
  toDateStr(addDays(parseISO(s), n))

/** Human label like 'Mon, Jun 10'. */
export const prettyDate = (s: string): string =>
  format(parseISO(s), 'EEE, MMM d')

export const prettyDateLong = (s: string): string =>
  format(parseISO(s), 'EEEE, MMMM d, yyyy')

export const isToday = (s: string | null): boolean =>
  !!s && dfIsToday(parseISO(s))

export const isOverdue = (s: string | null): boolean => {
  if (!s) return false
  return s < todayStr()
}

export {
  format,
  parseISO,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
}
