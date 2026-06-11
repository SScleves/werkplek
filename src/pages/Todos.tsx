import { useMemo, useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Settings2, Inbox } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button, Empty, inputClass } from '../components/ui'
import { TaskRow } from '../features/tasks/TaskRow'
import { TaskEditor } from '../features/tasks/TaskEditor'
import { ProjectModal } from '../features/projects/ProjectModal'
import { useProjects, useTasks } from '../hooks'
import { createTask } from '../lib/tasks'
import { isToday, isOverdue } from '../lib/date'
import type { Task, Project } from '../db/db'

type Bucket = { key: string; label: string; tasks: Task[] }

export function TodosPage() {
  const projects = useProjects()
  const tasks = useTasks()
  const [filter, setFilter] = useState<string>('all')
  const [quick, setQuick] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [projectModal, setProjectModal] = useState<Project | null | 'new'>(null)
  const [showDone, setShowDone] = useState(false)

  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects],
  )

  const quickTarget = filter !== 'all' ? filter : projects[0]?.id

  const visible = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((t) => t.projectId === filter)),
    [tasks, filter],
  )

  const { buckets, done } = useMemo(() => {
    const open = visible.filter((t) => !t.done)
    const doneTasks = visible
      .filter((t) => t.done)
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))

    const overdue: Task[] = []
    const today: Task[] = []
    const upcoming: Task[] = []
    const someday: Task[] = []
    for (const t of open) {
      if (!t.dueDate) someday.push(t)
      else if (isOverdue(t.dueDate)) overdue.push(t)
      else if (isToday(t.dueDate)) today.push(t)
      else upcoming.push(t)
    }
    const byDue = (a: Task, b: Task) =>
      (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || b.order - a.order
    overdue.sort(byDue)
    today.sort(byDue)
    upcoming.sort(byDue)
    someday.sort((a, b) => b.order - a.order)

    const list: Bucket[] = [
      { key: 'overdue', label: 'Overdue', tasks: overdue },
      { key: 'today', label: 'Today', tasks: today },
      { key: 'upcoming', label: 'Upcoming', tasks: upcoming },
      { key: 'someday', label: 'No date', tasks: someday },
    ].filter((b) => b.tasks.length > 0)
    return { buckets: list, done: doneTasks }
  }, [visible])

  const addQuick = async () => {
    if (!quick.trim() || !quickTarget) return
    await createTask({ title: quick, projectId: quickTarget, dueDate: null })
    setQuick('')
  }

  const openEditor = (t: Task) => {
    setEditing(t)
    setEditorOpen(true)
  }

  const openCount = visible.filter((t) => !t.done).length

  return (
    <>
      <PageHeader
        title="Todos"
        subtitle={`${openCount} open ${openCount === 1 ? 'task' : 'tasks'}`}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setEditorOpen(true)
            }}
          >
            <Plus size={16} /> New task
          </Button>
        }
      />

      <div className="mx-auto max-w-3xl px-8 py-6">
        {/* Project filter */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            <Inbox size={13} /> All
          </Chip>
          {projects.map((p) => (
            <Chip
              key={p.id}
              active={filter === p.id}
              onClick={() => setFilter(p.id)}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: p.color }}
              />
              {p.name}
            </Chip>
          ))}
          <button
            onClick={() => setProjectModal('new')}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            <Plus size={13} /> Project
          </button>
          {filter !== 'all' && projectMap[filter] && (
            <button
              onClick={() => setProjectModal(projectMap[filter])}
              className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
            >
              <Settings2 size={13} /> Edit project
            </button>
          )}
        </div>

        {/* Quick add */}
        <div className="mb-5 flex gap-2">
          <input
            className={inputClass}
            placeholder={`Add a task${
              quickTarget && projectMap[quickTarget]
                ? ` to ${projectMap[quickTarget].name}`
                : ''
            }…`}
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuick()}
          />
          <Button variant="subtle" onClick={addQuick} disabled={!quick.trim()}>
            <Plus size={16} />
          </Button>
        </div>

        {/* Buckets */}
        {buckets.length === 0 && done.length === 0 ? (
          <Empty
            icon={<Inbox size={28} />}
            title="Nothing here yet"
            hint="Add your first task above, or hit “New task”."
          />
        ) : (
          buckets.map((b) => (
            <section key={b.key} className="mb-5">
              <h3
                className={`mb-1 px-3 text-xs font-semibold uppercase tracking-wide ${
                  b.key === 'overdue'
                    ? 'text-red-500'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                {b.label} · {b.tasks.length}
              </h3>
              <div>
                {b.tasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    project={projectMap[t.projectId]}
                    onClick={() => openEditor(t)}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {/* Completed */}
        {done.length > 0 && (
          <section className="mt-2">
            <button
              onClick={() => setShowDone((s) => !s)}
              className="mb-1 flex items-center gap-1 px-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]"
            >
              {showDone ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              Completed · {done.length}
            </button>
            {showDone && (
              <div className="opacity-70">
                {done.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    project={projectMap[t.projectId]}
                    onClick={() => openEditor(t)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <TaskEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        task={editing}
        defaultProjectId={quickTarget}
      />
      <ProjectModal
        open={projectModal !== null}
        onClose={() => setProjectModal(null)}
        project={projectModal === 'new' ? null : projectModal}
        onCreated={(id) => setFilter(id)}
      />
    </>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
          : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {children}
    </button>
  )
}
