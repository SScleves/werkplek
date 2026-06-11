import { db, uid, type Note } from '../db/db'
import { todayStr, prettyDateLong } from './date'

const WIKI_RE = /\[\[([^\]]+)\]\]/g

/** Extract the titles referenced by [[wiki links]] in a note body. */
export function extractLinks(body: string): string[] {
  const out = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = WIKI_RE.exec(body))) out.add(m[1].trim())
  return [...out]
}

export async function createNote(partial: Partial<Note> = {}): Promise<Note> {
  const now = Date.now()
  const note: Note = {
    id: uid(),
    title: partial.title ?? 'Untitled note',
    body: partial.body ?? '',
    tags: partial.tags ?? [],
    journalDate: partial.journalDate ?? null,
    pinned: partial.pinned ?? false,
    createdAt: now,
    updatedAt: now,
  }
  await db.notes.add(note)
  return note
}

export async function updateNote(
  id: string,
  patch: Partial<Note>,
): Promise<void> {
  await db.notes.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id)
}

/** Find a note by its (case-insensitive) title. */
export async function findByTitle(title: string): Promise<Note | undefined> {
  const all = await db.notes.toArray()
  return all.find((n) => n.title.toLowerCase() === title.toLowerCase())
}

/** Open (or create) a note with the given title — used by [[wiki links]]. */
export async function resolveOrCreate(title: string): Promise<string> {
  const existing = await findByTitle(title)
  if (existing) return existing.id
  const note = await createNote({ title })
  return note.id
}

/** Get today's journal note, creating it if needed. */
export async function ensureTodayJournal(): Promise<string> {
  const today = todayStr()
  const existing = await db.notes.where('journalDate').equals(today).first()
  if (existing) return existing.id
  const note = await createNote({
    title: `Journal — ${prettyDateLong(today)}`,
    journalDate: today,
    body: '',
    tags: ['journal'],
  })
  return note.id
}

/** Convert [[Title]] into markdown links the renderer can intercept. */
export function preprocessWikiLinks(body: string): string {
  return body.replace(WIKI_RE, (_, title) => {
    const t = String(title).trim()
    return `[${t}](wiki:${encodeURIComponent(t)})`
  })
}
