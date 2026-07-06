import { db } from '../db/db'
import type { Table } from 'dexie'

const tbl = (name: string): Table => (db as unknown as Record<string, Table>)[name]

export const TABLES = [
  'projects',
  'tasks',
  'events',
  'notes',
  'pomodoros',
  'vocab',
  'gameStats',
  'settings',
] as const

export interface Snapshot {
  app: 'flowdeck'
  version: number
  exportedAt: string
  data: Record<string, unknown[]>
}

/** Serialize every table into a plain snapshot object (used by export + sync). */
export async function dumpAll(): Promise<Snapshot> {
  const data: Record<string, unknown[]> = {}
  for (const t of TABLES) data[t] = await tbl(t).toArray()
  return {
    app: 'flowdeck',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
}

/** Replace all local data with a snapshot (used by import + sync). */
export async function loadAll(snapshot: {
  app?: string
  data?: Record<string, unknown[]>
}): Promise<void> {
  if (snapshot.app !== 'flowdeck' || !snapshot.data)
    throw new Error('Not a valid Werkplek backup.')
  await db.transaction('rw', db.tables, async () => {
    for (const t of TABLES) {
      const rows = snapshot.data![t]
      if (!Array.isArray(rows)) continue
      await tbl(t).clear()
      await tbl(t).bulkAdd(rows)
    }
  })
}

export async function exportAll(): Promise<void> {
  const payload = await dumpAll()
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `werkplek-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importAll(file: File): Promise<void> {
  const parsed = JSON.parse(await file.text())
  await loadAll(parsed)
}
