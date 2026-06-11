import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Settings2, LayoutGrid } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button, Empty } from '../components/ui'
import { Board } from '../features/kanban/Board'
import { TaskEditor } from '../features/tasks/TaskEditor'
import { ProjectModal } from '../features/projects/ProjectModal'
import { useProjects, useProjectTasks } from '../hooks'
import type { Task } from '../db/db'

export function BoardsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const projects = useProjects()

  const active = projects.find((p) => p.id === projectId) ?? projects[0]
  const tasks = useProjectTasks(active?.id)

  const [editing, setEditing] = useState<Task | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [projectModal, setProjectModal] = useState<'new' | 'edit' | null>(null)

  // Keep the URL in sync with the active board
  useEffect(() => {
    if (active && active.id !== projectId)
      navigate(`/boards/${active.id}`, { replace: true })
  }, [active, projectId, navigate])

  if (projects.length === 0)
    return (
      <>
        <PageHeader title="Boards" />
        <Empty
          icon={<LayoutGrid size={28} />}
          title="No projects yet"
          hint="Create a project to start a board."
        />
        <div className="flex justify-center">
          <Button variant="primary" onClick={() => setProjectModal('new')}>
            <Plus size={16} /> New project
          </Button>
        </div>
        <ProjectModal
          open={projectModal !== null}
          onClose={() => setProjectModal(null)}
          onCreated={(id) => navigate(`/boards/${id}`)}
        />
      </>
    )

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {active && (
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: active.color }}
              />
            )}
            {active?.name ?? 'Boards'}
          </span>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => setProjectModal('edit')}>
              <Settings2 size={15} /> Edit
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null)
                setEditorOpen(true)
              }}
            >
              <Plus size={16} /> Task
            </Button>
          </>
        }
      />

      {/* Project tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--color-border)] px-8 py-2">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/boards/${p.id}`)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              p.id === active?.id
                ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            {p.name}
          </button>
        ))}
        <button
          onClick={() => setProjectModal('new')}
          className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <Plus size={14} /> Project
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {active && (
          <Board
            project={active}
            tasks={tasks}
            onEditTask={(t) => {
              setEditing(t)
              setEditorOpen(true)
            }}
          />
        )}
      </div>

      <TaskEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        task={editing}
        defaultProjectId={active?.id}
      />
      <ProjectModal
        open={projectModal !== null}
        onClose={() => setProjectModal(null)}
        project={projectModal === 'edit' ? active : null}
        onCreated={(id) => navigate(`/boards/${id}`)}
      />
    </div>
  )
}
