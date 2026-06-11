import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  LayoutGrid,
  Calendar,
  FileText,
  Timer,
  GraduationCap,
  Settings as SettingsIcon,
  Plus,
  CalendarDays,
  Search,
} from 'lucide-react'
import { createNote, ensureTodayJournal } from '../lib/notes'
import { usePomodoro } from '../store/pomodoro'

interface Cmd {
  id: string
  label: string
  icon: typeof Search
  group: string
  run: () => void
}

export function CommandPalette() {
  const navigate = useNavigate()
  const startTimer = usePomodoro((s) => s.start)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        setQ('')
        setActive(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const close = () => setOpen(false)

  const commands: Cmd[] = useMemo(
    () => [
      { id: 'd', label: 'Dashboard', icon: LayoutDashboard, group: 'Go to', run: () => navigate('/') },
      { id: 't', label: 'Todos', icon: CheckSquare, group: 'Go to', run: () => navigate('/todos') },
      { id: 'b', label: 'Boards', icon: LayoutGrid, group: 'Go to', run: () => navigate('/boards') },
      { id: 'c', label: 'Calendar', icon: Calendar, group: 'Go to', run: () => navigate('/calendar') },
      { id: 'n', label: 'Notes', icon: FileText, group: 'Go to', run: () => navigate('/notes') },
      { id: 'f', label: 'Focus', icon: Timer, group: 'Go to', run: () => navigate('/focus') },
      { id: 'du', label: 'Dutch', icon: GraduationCap, group: 'Go to', run: () => navigate('/dutch') },
      { id: 's', label: 'Settings', icon: SettingsIcon, group: 'Go to', run: () => navigate('/settings') },
      {
        id: 'new-note',
        label: 'New note',
        icon: Plus,
        group: 'Create',
        run: async () => {
          const note = await createNote({ title: 'Untitled note' })
          navigate(`/notes/${note.id}`)
        },
      },
      {
        id: 'journal',
        label: "Open today's journal",
        icon: CalendarDays,
        group: 'Create',
        run: async () => {
          const id = await ensureTodayJournal()
          navigate(`/notes/${id}`)
        },
      },
      {
        id: 'focus-start',
        label: 'Start a focus session',
        icon: Timer,
        group: 'Create',
        run: () => {
          startTimer()
          navigate('/focus')
        },
      },
    ],
    [navigate, startTimer],
  )

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim()
    return s
      ? commands.filter((c) => c.label.toLowerCase().includes(s))
      : commands
  }, [q, commands])

  // Clamp the highlighted row if filtering shrank the list
  const activeIdx = Math.min(active, Math.max(0, filtered.length - 1))

  if (!open) return null

  const groups = [...new Set(filtered.map((c) => c.group))]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/30 p-4 pt-[15vh]"
      onMouseDown={close}
    >
      <div
        className="fd-pop w-full max-w-lg overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4">
          <Search size={16} className="text-[var(--color-muted)]" />
          <input
            autoFocus
            className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-[var(--color-muted)]"
            placeholder="Type a command or search…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive(Math.min(activeIdx + 1, filtered.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive(Math.max(activeIdx - 1, 0))
              }
              if (e.key === 'Enter' && filtered[activeIdx]) {
                filtered[activeIdx].run()
                close()
              }
            }}
          />
          <kbd className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)]">
            esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-[var(--color-muted)]">
              No matches
            </p>
          )}
          {groups.map((g) => (
            <div key={g} className="mb-1">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                {g}
              </p>
              {filtered
                .filter((c) => c.group === g)
                .map((c) => {
                  const idx = filtered.indexOf(c)
                  return (
                    <button
                      key={c.id}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => {
                        c.run()
                        close()
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
                        idx === activeIdx
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                          : 'hover:bg-[var(--color-surface-2)]'
                      }`}
                    >
                      <c.icon size={16} />
                      {c.label}
                    </button>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
