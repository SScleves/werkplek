import { db, uid, type VocabCard } from '../db/db'
import { todayStr, addDaysStr } from './date'

// ---- Deck management ------------------------------------------------------

export interface VocabInput {
  dutch: string
  english: string
  theme: string
  example?: string
}

export async function createVocab(input: VocabInput): Promise<void> {
  await db.vocab.add({
    id: uid(),
    dutch: input.dutch.trim(),
    english: input.english.trim(),
    theme: input.theme.trim() || 'Custom',
    example: input.example?.trim() || undefined,
    ease: 2.5,
    intervalDays: 0,
    dueDate: todayStr(),
    reps: 0,
    lapses: 0,
    lastReviewed: null,
  })
}

export async function updateVocab(
  id: string,
  patch: Partial<VocabCard>,
): Promise<void> {
  await db.vocab.update(id, patch)
}

export async function deleteVocab(id: string): Promise<void> {
  await db.vocab.delete(id)
}

/** Bulk import from "dutch, english" or "dutch - english" lines. */
export async function importVocabLines(
  text: string,
  theme: string,
): Promise<number> {
  const rows: VocabInput[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const m = line.split(/\s*[,;\t]|\s+[-–—]\s+/).filter(Boolean)
    if (m.length >= 2) rows.push({ dutch: m[0], english: m[1], theme })
  }
  for (const r of rows) await createVocab(r)
  return rows.length
}

// ---- Spaced repetition (light SM-2) --------------------------------------

export async function reviewCard(
  card: VocabCard,
  correct: boolean,
): Promise<void> {
  let { ease, intervalDays, reps, lapses } = card
  if (correct) {
    reps += 1
    intervalDays =
      reps === 1 ? 1 : reps === 2 ? 3 : Math.round(intervalDays * ease)
    ease = Math.min(3.0, ease + 0.1)
  } else {
    reps = 0
    lapses += 1
    intervalDays = 0
    ease = Math.max(1.3, ease - 0.2)
  }
  await db.vocab.update(card.id, {
    ease,
    intervalDays,
    reps,
    lapses,
    lastReviewed: Date.now(),
    dueDate: intervalDays > 0 ? addDaysStr(todayStr(), intervalDays) : todayStr(),
  })
}

// ---- Streak / XP ----------------------------------------------------------

const XP_PER_CORRECT = 10

export async function recordReview(correct: boolean): Promise<void> {
  const stats = await db.gameStats.get('stats')
  if (!stats) return
  const today = todayStr()
  let streak = stats.streak
  if (stats.lastPlayed !== today) {
    streak = stats.lastPlayed === addDaysStr(today, -1) ? streak + 1 : 1
  }
  await db.gameStats.update('stats', {
    totalReviews: stats.totalReviews + 1,
    xp: stats.xp + (correct ? XP_PER_CORRECT : 1),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    lastPlayed: today,
  })
}

// ---- Session building -----------------------------------------------------

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick a session of `size` cards, prioritising those due today. */
export function buildSession(
  all: VocabCard[],
  size: number,
  theme?: string,
): VocabCard[] {
  const today = todayStr()
  const pool = theme ? all.filter((c) => c.theme === theme) : all
  const due = shuffle(pool.filter((c) => c.dueDate <= today))
  const rest = shuffle(pool.filter((c) => c.dueDate > today))
  return [...due, ...rest].slice(0, Math.min(size, pool.length))
}

export function dueCount(all: VocabCard[]): number {
  const today = todayStr()
  return all.filter((c) => c.dueDate <= today).length
}

/** Normalise an answer for lenient comparison. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\(.*?\)/g, '')
    .replace(/[.!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Accept any '/'-separated alternative as correct. */
export function matchesAnswer(input: string, answer: string): boolean {
  const got = normalize(input)
  if (!got) return false
  return answer
    .split('/')
    .map(normalize)
    .some((a) => a === got)
}

/** N wrong English options for a card (for multiple choice). */
export function distractors(
  card: VocabCard,
  all: VocabCard[],
  n: number,
): string[] {
  const pool = shuffle(
    all.filter((c) => c.id !== card.id && c.english !== card.english),
  )
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of pool) {
    if (out.length >= n) break
    if (seen.has(c.english)) continue
    seen.add(c.english)
    out.push(c.english)
  }
  return out
}
