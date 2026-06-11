import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal, Button, inputClass, useAutoFocus } from '../../components/ui'
import { useProjects } from '../../hooks'
import { createTask, updateTask, deleteTask } from '../../lib/tasks'
import { useToast } from '../../store/toast'
import { db, type Task, type Priority, type Recurrence } from '../../db/db'

const RECURRENCE_OPTS: { value: Recurrence; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

interface Props {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultProjectId?: string
  defaultColumnId?: string
  defaultDueDate?: string | null
}

const PRIORITIES: { value: Priority | ''; label: string; color: string }[] = [
  { value: '', label: 'None', color: 'var(--color-muted)' },
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'med', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
]

export function TaskEditor({
  open,
  onClose,
  task,
  defaultProjectId,
  defaultColumnId,
  defaultDueDate,
}: Props) {
  const projects = useProjects()
  const titleRef = useAutoFocus<HTMLInputElement>(open)

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [projectId, setProjectId] = useState('')
  const [columnId, setColumnId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [tags, setTags] = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')

  // Reset form whenever the modal opens
  /* eslint-disable react-hooks/set-state-in-effect -- intentional: seed form state from the task when the modal (re)opens */
  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setNotes(task?.notes ?? '')
    setProjectId(task?.projectId ?? defaultProjectId ?? projects[0]?.id ?? '')
    setColumnId(task?.columnId ?? defaultColumnId ?? '')
    setDueDate(task?.dueDate ?? defaultDueDate ?? '')
    setPriority(task?.priority ?? '')
    setTags(task?.tags.join(', ') ?? '')
    setRecurrence(task?.recurrence ?? 'none')
  }, [open, task]) // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  const project = projects.find((p) => p.id === projectId)

  const save = async () => {
    if (!title.trim() || !projectId) return
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    if (task) {
      await updateTask(task.id, {
        title: title.trim(),
        notes,
        projectId,
        columnId: columnId || task.columnId,
        dueDate: dueDate || null,
        priority: priority || null,
        tags: parsedTags,
        recurrence,
      })
    } else {
      await createTask({
        title,
        notes,
        projectId,
        columnId: columnId || undefined,
        dueDate: dueDate || null,
        priority: priority || null,
        tags: parsedTags,
        recurrence,
      })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'}>
      <div className="flex flex-col gap-3">
        <input
          ref={titleRef}
          className={`${inputClass} text-base font-medium`}
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
          }}
        />
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
            Project
            <select
              className={inputClass}
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value)
                setColumnId('')
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
            Column
            <select
              className={inputClass}
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
            >
              <option value="">Default</option>
              {project?.columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
            Due date
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
            Priority
            <select
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority | '')}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
            Repeat {recurrence !== 'none' && !dueDate && '(needs a due date)'}
            <select
              className={inputClass}
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
            >
              {RECURRENCE_OPTS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
          Tags (comma separated)
          <input
            className={inputClass}
            placeholder="work, urgent"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </label>

        <div className="mt-2 flex items-center justify-between">
          {task ? (
            <Button
              variant="ghost"
              onClick={async () => {
                const snapshot = { ...task }
                await deleteTask(task.id)
                onClose()
                useToast.getState().show({
                  message: `Deleted “${snapshot.title}”`,
                  actionLabel: 'Undo',
                  onAction: async () => {
                    await db.tasks.add(snapshot)
                  },
                })
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
            <Button variant="primary" onClick={save} disabled={!title.trim()}>
              {task ? 'Save' : 'Add task'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
