import { Check, Flame, Repeat } from 'lucide-react'
import type { Task, Project } from '../../db/db'
import { toggleDone } from '../../lib/tasks'
import { prettyDate, isToday, isOverdue } from '../../lib/date'
import { useToast } from '../../store/toast'

const priorityColor: Record<string, string> = {
  low: '#10b981',
  med: '#f59e0b',
  high: '#ef4444',
}

export function TaskRow({
  task,
  project,
  onClick,
}: {
  task: Task
  project?: Project
  onClick?: () => void
}) {
  return (
    <div
      className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-[var(--color-surface-2)]"
    >
      <button
        onClick={async (e) => {
          e.stopPropagation()
          const { rescheduledTo } = await toggleDone(task)
          if (rescheduledTo)
            useToast.getState().show({
              message: `↻ Done — rescheduled to ${prettyDate(rescheduledTo)}`,
            })
        }}
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition ${
          task.done
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
            : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
        }`}
        aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.done && <Check size={13} strokeWidth={3} />}
      </button>

      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        {task.priority && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: priorityColor[task.priority] }}
            title={`${task.priority} priority`}
          />
        )}
        <span
          className={`truncate text-sm ${
            task.done ? 'text-[var(--color-muted)] line-through' : ''
          }`}
        >
          {task.title}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--color-muted)]">
        {task.recurrence && task.recurrence !== 'none' && (
          <Repeat size={12} className="opacity-70" />
        )}
        {task.tags.map((t) => (
          <span
            key={t}
            className="hidden rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 sm:inline"
          >
            {t}
          </span>
        ))}
        {task.pomodorosDone > 0 && (
          <span className="flex items-center gap-0.5" title="Pomodoros done">
            <Flame size={12} /> {task.pomodorosDone}
          </span>
        )}
        {task.dueDate && (
          <span
            className={
              isOverdue(task.dueDate) && !task.done
                ? 'text-red-500'
                : isToday(task.dueDate)
                  ? 'text-[var(--color-accent)]'
                  : ''
            }
          >
            {isToday(task.dueDate) ? 'Today' : prettyDate(task.dueDate)}
          </span>
        )}
        {project && (
          <span className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: project.color }}
            />
            <span className="hidden md:inline">{project.name}</span>
          </span>
        )}
      </div>
    </div>
  )
}
