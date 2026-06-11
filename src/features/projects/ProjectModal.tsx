import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal, Button, inputClass, useAutoFocus } from '../../components/ui'
import {
  createProject,
  updateProject,
  deleteProject,
  PROJECT_COLORS,
} from '../../lib/tasks'
import type { Project } from '../../db/db'

export function ProjectModal({
  open,
  onClose,
  project,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  project?: Project | null
  onCreated?: (id: string) => void
}) {
  const nameRef = useAutoFocus<HTMLInputElement>(open)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])

  /* eslint-disable react-hooks/set-state-in-effect -- intentional: seed form state when the modal (re)opens */
  useEffect(() => {
    if (!open) return
    setName(project?.name ?? '')
    setColor(project?.color ?? PROJECT_COLORS[0])
  }, [open, project])
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    if (!name.trim()) return
    if (project) {
      await updateProject(project.id, { name: name.trim(), color })
    } else {
      const p = await createProject(name, color)
      onCreated?.(p.id)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? 'Edit project' : 'New project'}
      width="max-w-sm"
    >
      <div className="flex flex-col gap-4">
        <input
          ref={nameRef}
          className={inputClass}
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full transition ${
                color === c
                  ? 'ring-2 ring-[var(--color-text)] ring-offset-2 ring-offset-[var(--color-surface)]'
                  : ''
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          {project ? (
            <Button
              variant="ghost"
              onClick={async () => {
                if (
                  confirm(
                    `Delete "${project.name}" and all its tasks? This cannot be undone.`,
                  )
                ) {
                  await deleteProject(project.id)
                  onClose()
                }
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
            <Button variant="primary" onClick={save} disabled={!name.trim()}>
              {project ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
