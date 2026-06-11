import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Plus, MoreHorizontal } from 'lucide-react'
import { KanbanCard } from './Card'
import { Button, inputClass } from '../../components/ui'
import { db, type Project, type Task } from '../../db/db'
import { createTask, updateProject, addColumn } from '../../lib/tasks'

type Containers = Record<string, string[]>

export function Board({
  project,
  tasks,
  onEditTask,
}: {
  project: Project
  tasks: Task[]
  onEditTask: (t: Task) => void
}) {
  const taskMap = useMemo(
    () => Object.fromEntries(tasks.map((t) => [t.id, t])),
    [tasks],
  )

  const buildContainers = useMemo<Containers>(() => {
    const c: Containers = {}
    for (const col of project.columns) c[col.id] = []
    const sorted = [...tasks].sort((a, b) => a.order - b.order)
    for (const t of sorted) {
      if (c[t.columnId]) c[t.columnId].push(t.id)
      else if (project.columns[0]) c[project.columns[0].id].push(t.id)
    }
    return c
  }, [tasks, project.columns])

  const [containers, setContainers] = useState<Containers>(buildContainers)
  const [activeId, setActiveId] = useState<string | null>(null)
  const dragging = useRef(false)

  // Sync from DB when not mid-drag
  useEffect(() => {
    if (!dragging.current) setContainers(buildContainers)
  }, [buildContainers])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const findContainer = (id: string): string | undefined => {
    if (id in containers) return id
    return Object.keys(containers).find((k) => containers[k].includes(id))
  }

  const onDragStart = (e: DragStartEvent) => {
    dragging.current = true
    setActiveId(e.active.id as string)
  }

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over) return
    const activeC = findContainer(active.id as string)
    const overC = findContainer(over.id as string)
    if (!activeC || !overC || activeC === overC) return

    setContainers((prev) => {
      const activeItems = [...prev[activeC]]
      const overItems = [...prev[overC]]
      const activeIdx = activeItems.indexOf(active.id as string)
      activeItems.splice(activeIdx, 1)
      const overIdx =
        over.id in prev ? overItems.length : overItems.indexOf(over.id as string)
      overItems.splice(overIdx < 0 ? overItems.length : overIdx, 0, active.id as string)
      return { ...prev, [activeC]: activeItems, [overC]: overItems }
    })
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    const activeC = findContainer(active.id as string)
    let next = containers
    if (over) {
      const overC = findContainer(over.id as string)
      if (activeC && overC && activeC === overC) {
        const items = containers[activeC]
        const from = items.indexOf(active.id as string)
        const to =
          over.id in containers ? items.length - 1 : items.indexOf(over.id as string)
        if (from !== to && to >= 0) {
          next = { ...containers, [activeC]: arrayMove(items, from, to) }
          setContainers(next)
        }
      }
    }
    persist(next)
    dragging.current = false
    setActiveId(null)
  }

  const persist = async (cs: Containers) => {
    await db.transaction('rw', db.tasks, async () => {
      for (const col of project.columns) {
        const ids = cs[col.id] ?? []
        const done = !!col.isDone
        for (let i = 0; i < ids.length; i++) {
          const t = taskMap[ids[i]]
          if (!t) continue
          await db.tasks.update(ids[i], {
            columnId: col.id,
            order: i,
            done,
            completedAt: done ? (t.completedAt ?? Date.now()) : null,
          })
        }
      }
    })
  }

  const activeTask = activeId ? taskMap[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        dragging.current = false
        setActiveId(null)
        setContainers(buildContainers)
      }}
    >
      <div className="flex h-full items-start gap-4 overflow-x-auto px-8 py-6">
        {project.columns.map((col) => (
          <KanbanColumn
            key={col.id}
            project={project}
            columnId={col.id}
            name={col.name}
            isDone={col.isDone}
            itemIds={containers[col.id] ?? []}
            taskMap={taskMap}
            onEditTask={onEditTask}
          />
        ))}
        <AddColumn project={project} />
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  project,
  columnId,
  name,
  isDone,
  itemIds,
  taskMap,
  onEditTask,
}: {
  project: Project
  columnId: string
  name: string
  isDone?: boolean
  itemIds: string[]
  taskMap: Record<string, Task>
  onEditTask: (t: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId })
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')

  const add = async () => {
    if (!text.trim()) return
    await createTask({ title: text, projectId: project.id, columnId })
    setText('')
  }

  const renameColumn = () => {
    const newName = prompt('Rename column', name)
    if (newName && newName.trim()) {
      const cols = project.columns.map((c) =>
        c.id === columnId ? { ...c, name: newName.trim() } : c,
      )
      updateProject(project.id, { columns: cols })
    }
  }

  const deleteColumn = async () => {
    if (project.columns.length <= 1) return
    const count = itemIds.length
    if (
      count > 0 &&
      !confirm(`Delete "${name}"? Its ${count} task(s) move to the first column.`)
    )
      return
    const remaining = project.columns.filter((c) => c.id !== columnId)
    const target = remaining[0].id
    await db.transaction('rw', db.tasks, db.projects, async () => {
      for (const id of itemIds) await db.tasks.update(id, { columnId: target })
      await db.projects.update(project.id, { columns: remaining })
    })
  }

  const moveColumn = (dir: -1 | 1) => {
    const cols = [...project.columns]
    const i = cols.findIndex((c) => c.id === columnId)
    const j = i + dir
    if (i < 0 || j < 0 || j >= cols.length) return
    ;[cols[i], cols[j]] = [cols[j], cols[i]]
    updateProject(project.id, { columns: cols })
  }

  const colIndex = project.columns.findIndex((c) => c.id === columnId)

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-[var(--color-surface-2)]/50">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          {isDone && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
          <span className="text-sm font-semibold">{name}</span>
          <span className="text-xs text-[var(--color-muted)]">
            {itemIds.length}
          </span>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setAdding(true)}
            className="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
            aria-label="Add card"
          >
            <Plus size={15} />
          </button>
          <ColumnMenu
            onRename={renameColumn}
            onDelete={deleteColumn}
            onMoveLeft={colIndex > 0 ? () => moveColumn(-1) : undefined}
            onMoveRight={
              colIndex < project.columns.length - 1
                ? () => moveColumn(1)
                : undefined
            }
          />
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[60px] flex-1 flex-col gap-2 rounded-lg px-2 pb-2 transition ${
          isOver ? 'bg-[var(--color-accent-soft)]/40' : ''
        }`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {itemIds.map((id) =>
            taskMap[id] ? (
              <KanbanCard
                key={id}
                task={taskMap[id]}
                onClick={() => onEditTask(taskMap[id])}
              />
            ) : null,
          )}
        </SortableContext>

        {adding && (
          <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
            <textarea
              autoFocus
              className={`${inputClass} min-h-14 resize-none border-0 p-1`}
              placeholder="Card title…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  add()
                }
                if (e.key === 'Escape') setAdding(false)
              }}
              onBlur={() => {
                if (text.trim()) add()
                setAdding(false)
              }}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={add} className="text-xs">
                Add
              </Button>
              <Button
                variant="ghost"
                onClick={() => setAdding(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!adding && itemIds.length === 0 && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg py-2 text-xs text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)]"
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  )
}

function ColumnMenu({
  onRename,
  onDelete,
  onMoveLeft,
  onMoveRight,
}: {
  onRename: () => void
  onDelete: () => void
  onMoveLeft?: () => void
  onMoveRight?: () => void
}) {
  const [open, setOpen] = useState(false)
  const item =
    'block w-full px-3 py-1.5 text-left hover:bg-[var(--color-surface-2)]'
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
        aria-label="Column options"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-10 w-36 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 text-sm shadow-lg">
          <button onMouseDown={onRename} className={item}>
            Rename
          </button>
          {onMoveLeft && (
            <button onMouseDown={onMoveLeft} className={item}>
              ← Move left
            </button>
          )}
          {onMoveRight && (
            <button onMouseDown={onMoveRight} className={item}>
              Move right →
            </button>
          )}
          <button onMouseDown={onDelete} className={`${item} text-red-500`}>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function AddColumn({ project }: { project: Project }) {
  const add = () => {
    const name = prompt('New column name')
    if (name && name.trim())
      updateProject(project.id, { columns: addColumn(project, name.trim()) })
  }
  return (
    <button
      onClick={add}
      className="flex w-56 shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
    >
      <Plus size={15} /> Add column
    </button>
  )
}
