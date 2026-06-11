import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Flame, Calendar as CalIcon, Repeat } from 'lucide-react'
import type { Task } from '../../db/db'
import { prettyDate, isToday, isOverdue } from '../../lib/date'

const priorityColor: Record<string, string> = {
  low: '#10b981',
  med: '#f59e0b',
  high: '#ef4444',
}

export function KanbanCard({
  task,
  onClick,
  overlay = false,
}: {
  task: Task
  onClick?: () => void
  overlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'card', task } })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group cursor-grab rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left shadow-sm transition active:cursor-grabbing ${
        overlay ? 'rotate-2 shadow-lg' : 'hover:border-[var(--color-accent)]'
      }`}
    >
      <div className="flex items-start gap-2">
        {task.priority && (
          <span
            className="mt-1 h-2 w-2 shrink-0 rounded-full"
            style={{ background: priorityColor[task.priority] }}
          />
        )}
        <p
          className={`flex-1 text-sm leading-snug ${
            task.done ? 'text-[var(--color-muted)] line-through' : ''
          }`}
        >
          {task.title}
        </p>
      </div>

      {(task.tags.length > 0 ||
        task.dueDate ||
        task.pomodorosDone > 0 ||
        (task.recurrence && task.recurrence !== 'none')) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
          {task.dueDate && (
            <span
              className={`flex items-center gap-0.5 ${
                isOverdue(task.dueDate) && !task.done
                  ? 'text-red-500'
                  : isToday(task.dueDate)
                    ? 'text-[var(--color-accent)]'
                    : ''
              }`}
            >
              <CalIcon size={11} />
              {isToday(task.dueDate) ? 'Today' : prettyDate(task.dueDate)}
            </span>
          )}
          {task.pomodorosDone > 0 && (
            <span className="flex items-center gap-0.5">
              <Flame size={11} /> {task.pomodorosDone}
            </span>
          )}
          {task.recurrence && task.recurrence !== 'none' && (
            <Repeat size={11} className="opacity-70" />
          )}
          {task.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[var(--color-surface-2)] px-1.5 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
