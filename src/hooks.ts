import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS } from './db/db'

export function useSettings() {
  return useLiveQuery(async () => (await db.settings.get('settings')) ?? DEFAULT_SETTINGS, [])
}

export function useProjects() {
  return useLiveQuery(() => db.projects.orderBy('order').toArray(), [], [])
}

export function useProject(id: string | undefined) {
  return useLiveQuery(
    async () => (id ? await db.projects.get(id) : undefined),
    [id],
  )
}

export function useTasks() {
  return useLiveQuery(() => db.tasks.toArray(), [], [])
}

export function useProjectTasks(projectId: string | undefined) {
  return useLiveQuery(
    async () =>
      projectId
        ? await db.tasks.where('projectId').equals(projectId).toArray()
        : [],
    [projectId],
    [],
  )
}

export function useNotes() {
  return useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), [], [])
}

export function useEvents() {
  return useLiveQuery(() => db.events.toArray(), [], [])
}

export function useGameStats() {
  return useLiveQuery(() => db.gameStats.get('stats'), [])
}
