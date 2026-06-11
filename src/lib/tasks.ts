import { addDays, addMonths, parseISO } from 'date-fns'
import {
  db,
  uid,
  type Task,
  type Project,
  type Column,
  type Recurrence,
} from '../db/db'
import { toDateStr, todayStr } from './date'

// ---- Tasks ----------------------------------------------------------------

export interface NewTask {
  title: string
  projectId: string
  columnId?: string
  notes?: string
  dueDate?: string | null
  priority?: Task['priority']
  tags?: string[]
  recurrence?: Recurrence
}

/** Pick a column for a new task: the project's first non-done column. */
function defaultColumn(project: Project): string {
  const open = project.columns.find((c) => !c.isDone) ?? project.columns[0]
  return open.id
}

export async function createTask(input: NewTask): Promise<Task> {
  const project = await db.projects.get(input.projectId)
  if (!project) throw new Error('Project not found')
  const columnId = input.columnId ?? defaultColumn(project)
  const task: Task = {
    id: uid(),
    title: input.title.trim(),
    notes: input.notes ?? '',
    projectId: input.projectId,
    columnId,
    done: false,
    dueDate: input.dueDate ?? null,
    priority: input.priority ?? null,
    tags: input.tags ?? [],
    pomodorosDone: 0,
    order: Date.now(),
    createdAt: Date.now(),
    completedAt: null,
    recurrence: input.recurrence ?? 'none',
  }
  await db.tasks.add(task)
  return task
}

export async function updateTask(
  id: string,
  patch: Partial<Task>,
): Promise<void> {
  await db.tasks.update(id, patch)
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id)
}

/** Next due date for a recurring task. Skips ahead from overdue dates so a
 *  task three weeks overdue lands on the next future occurrence, not the past. */
export function nextDueDate(dueDate: string, rec: Recurrence): string {
  const today = todayStr()
  let d = parseISO(dueDate)
  let guard = 0
  do {
    d =
      rec === 'daily'
        ? addDays(d, 1)
        : rec === 'weekly'
          ? addDays(d, 7)
          : addMonths(d, 1)
  } while (toDateStr(d) <= today && guard++ < 1200)
  return toDateStr(d)
}

/** Toggle completion. Also moves the card to/from the project's done column.
 *  Completing a recurring task reschedules it instead (Todoist-style) and
 *  returns the new due date. */
export async function toggleDone(
  task: Task,
): Promise<{ rescheduledTo?: string }> {
  const completing = !task.done

  if (
    completing &&
    task.recurrence &&
    task.recurrence !== 'none' &&
    task.dueDate
  ) {
    const rescheduledTo = nextDueDate(task.dueDate, task.recurrence)
    await db.tasks.update(task.id, { dueDate: rescheduledTo })
    return { rescheduledTo }
  }

  const project = await db.projects.get(task.projectId)
  const patch: Partial<Task> = {
    done: completing,
    completedAt: completing ? Date.now() : null,
  }
  if (project) {
    const doneCol = project.columns.find((c) => c.isDone)
    const firstOpen = project.columns.find((c) => !c.isDone)
    if (completing && doneCol) patch.columnId = doneCol.id
    if (!completing && task.columnId === doneCol?.id && firstOpen)
      patch.columnId = firstOpen.id
  }
  await db.tasks.update(task.id, patch)
  return {}
}

/** Move a task to a column (kanban drag). Syncs done flag with isDone column. */
export async function moveTask(
  task: Task,
  columnId: string,
  order: number,
): Promise<void> {
  const project = await db.projects.get(task.projectId)
  const col = project?.columns.find((c) => c.id === columnId)
  const done = !!col?.isDone
  await db.tasks.update(task.id, {
    columnId,
    order,
    done,
    completedAt: done ? task.completedAt ?? Date.now() : null,
  })
}

// ---- Projects -------------------------------------------------------------

export async function createProject(
  name: string,
  color: string,
): Promise<Project> {
  const count = await db.projects.count()
  const project: Project = {
    id: uid(),
    name: name.trim() || 'Untitled',
    color,
    columns: [
      { id: uid(), name: 'Backlog' },
      { id: uid(), name: 'To Do' },
      { id: uid(), name: 'In Progress' },
      { id: uid(), name: 'Done', isDone: true },
    ],
    order: count,
    createdAt: Date.now(),
  }
  await db.projects.add(project)
  return project
}

export async function updateProject(
  id: string,
  patch: Partial<Project>,
): Promise<void> {
  await db.projects.update(id, patch)
}

/** Delete a project and all of its tasks. */
export async function deleteProject(id: string): Promise<void> {
  await db.transaction('rw', db.projects, db.tasks, async () => {
    await db.tasks.where('projectId').equals(id).delete()
    await db.projects.delete(id)
  })
}

export function addColumn(project: Project, name: string): Column[] {
  const cols = [...project.columns]
  // insert before the done column if present
  const doneIdx = cols.findIndex((c) => c.isDone)
  const col: Column = { id: uid(), name }
  if (doneIdx === -1) cols.push(col)
  else cols.splice(doneIdx, 0, col)
  return cols
}

export const PROJECT_COLORS = [
  '#4f6ef7',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#64748b',
]
