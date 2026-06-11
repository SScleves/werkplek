import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  FileText,
  CalendarDays,
  Pin,
  Trash2,
  Eye,
  Pencil,
} from 'lucide-react'
import { Empty, IconButton, inputClass } from '../components/ui'
import { useNotes } from '../hooks'
import {
  createNote,
  updateNote,
  deleteNote,
  ensureTodayJournal,
  resolveOrCreate,
  extractLinks,
} from '../lib/notes'
import { prettyDate } from '../lib/date'
import type { Note } from '../db/db'

// react-markdown is heavy — load it only when a note preview is shown
const Markdown = lazy(() =>
  import('../features/notes/Markdown').then((m) => ({ default: m.Markdown })),
)

export function NotesPage() {
  const { noteId } = useParams()
  const navigate = useNavigate()
  const notes = useNotes()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split')

  const selected = notes.find((n) => n.id === noteId)

  // Default-select the first note
  useEffect(() => {
    if (!noteId && notes.length) navigate(`/notes/${notes[0].id}`, { replace: true })
  }, [noteId, notes, navigate])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const list = q
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q) ||
            n.tags.some((t) => t.toLowerCase().includes(q)),
        )
      : notes
    return {
      pinned: list.filter((n) => n.pinned),
      journal: list.filter((n) => !n.pinned && n.journalDate),
      notes: list.filter((n) => !n.pinned && !n.journalDate),
    }
  }, [notes, query])

  const newNote = async () => {
    const n = await createNote({ title: 'Untitled note' })
    navigate(`/notes/${n.id}`)
  }
  const openJournal = async () => {
    const id = await ensureTodayJournal()
    navigate(`/notes/${id}`)
  }
  const onWikiLink = async (title: string) => {
    const id = await resolveOrCreate(title)
    navigate(`/notes/${id}`)
  }

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="flex w-72 shrink-0 flex-col border-r border-[var(--color-border)]">
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-2.5 top-2.5 text-[var(--color-muted)]"
            />
            <input
              className={`${inputClass} pl-8`}
              placeholder="Search notes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          <button
            onClick={newNote}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--color-surface-2)] py-1.5 text-xs font-medium hover:brightness-95"
          >
            <Plus size={14} /> New
          </button>
          <button
            onClick={openJournal}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--color-surface-2)] py-1.5 text-xs font-medium hover:brightness-95"
          >
            <CalendarDays size={14} /> Journal
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {notes.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-[var(--color-muted)]">
              No notes yet
            </p>
          )}
          <NoteGroup
            label="Pinned"
            items={filtered.pinned}
            selectedId={noteId}
            onSelect={(id) => navigate(`/notes/${id}`)}
          />
          <NoteGroup
            label="Journal"
            items={filtered.journal}
            selectedId={noteId}
            onSelect={(id) => navigate(`/notes/${id}`)}
          />
          <NoteGroup
            label="Notes"
            items={filtered.notes}
            selectedId={noteId}
            onSelect={(id) => navigate(`/notes/${id}`)}
          />
        </div>
      </div>

      {/* Editor */}
      {selected ? (
        <NoteEditor
          key={selected.id}
          note={selected}
          mode={mode}
          setMode={setMode}
          allNotes={notes}
          onWikiLink={onWikiLink}
          onDeleted={() => navigate('/notes', { replace: true })}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <Empty
            icon={<FileText size={28} />}
            title="No note selected"
            hint="Pick a note from the list, or create a new one."
          />
        </div>
      )}
    </div>
  )
}

function NoteGroup({
  label,
  items,
  selectedId,
  onSelect,
}: {
  label: string
  items: Note[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="mb-3">
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => onSelect(n.id)}
          className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition ${
            n.id === selectedId
              ? 'bg-[var(--color-accent-soft)]'
              : 'hover:bg-[var(--color-surface-2)]'
          }`}
        >
          <span className="flex w-full items-center gap-1.5">
            {n.pinned && <Pin size={11} className="text-[var(--color-accent)]" />}
            <span className="flex-1 truncate text-sm font-medium">
              {n.title || 'Untitled'}
            </span>
          </span>
          <span className="truncate text-xs text-[var(--color-muted)]">
            {n.body.replace(/[#*[\]>`]/g, '').slice(0, 50) || 'Empty'}
          </span>
        </button>
      ))}
    </div>
  )
}

function NoteEditor({
  note,
  mode,
  setMode,
  allNotes,
  onWikiLink,
  onDeleted,
}: {
  note: Note
  mode: 'split' | 'edit' | 'preview'
  setMode: (m: 'split' | 'edit' | 'preview') => void
  allNotes: Note[]
  onWikiLink: (title: string) => void
  onDeleted: () => void
}) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [tags, setTags] = useState(note.tags.join(', '))
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latest = useRef({ title, body, tags })
  const dirty = useRef(false)
  const isFirst = useRef(true)

  const flush = useCallback(() => {
    if (!dirty.current) return
    dirty.current = false
    const v = latest.current
    updateNote(note.id, {
      title: v.title.trim() || 'Untitled note',
      body: v.body,
      tags: v.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
  }, [note.id])

  // Debounced persistence — skips the initial mount so merely opening a
  // note doesn't bump its updatedAt.
  useEffect(() => {
    latest.current = { title, body, tags }
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    dirty.current = true
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flush, 400)
    return () => clearTimeout(saveTimer.current)
  }, [title, body, tags, flush])

  // Flush any pending edit when switching notes / leaving the page
  useEffect(() => () => flush(), [flush])

  // Backlinks: notes that reference this note's title
  const backlinks = useMemo(
    () =>
      allNotes.filter(
        (n) =>
          n.id !== note.id &&
          extractLinks(n.body).some(
            (l) => l.toLowerCase() === note.title.toLowerCase(),
          ),
      ),
    [allNotes, note.id, note.title],
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-6 py-3">
        <input
          className="flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-[var(--color-muted)]"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex rounded-lg bg-[var(--color-surface-2)] p-1">
          {(
            [
              ['edit', Pencil],
              ['split', FileText],
              ['preview', Eye],
            ] as const
          ).map(([m, Icon]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md p-1.5 transition ${
                mode === m
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-muted)]'
              }`}
              title={m}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
        <IconButton
          onClick={() => updateNote(note.id, { pinned: !note.pinned })}
          aria-label="Pin"
        >
          <Pin
            size={16}
            className={note.pinned ? 'text-[var(--color-accent)]' : ''}
          />
        </IconButton>
        <IconButton
          onClick={async () => {
            if (confirm('Delete this note?')) {
              await deleteNote(note.id)
              onDeleted()
            }
          }}
          aria-label="Delete"
        >
          <Trash2 size={16} />
        </IconButton>
      </div>

      {/* Tags */}
      <div className="border-b border-[var(--color-border)] px-6 py-2">
        <input
          className="w-full bg-transparent text-xs text-[var(--color-muted)] outline-none"
          placeholder="Tags (comma separated)…"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {mode !== 'preview' && (
          <textarea
            className={`min-h-0 flex-1 resize-none bg-transparent p-6 font-mono text-sm leading-relaxed outline-none ${
              mode === 'split' ? 'border-r border-[var(--color-border)]' : ''
            }`}
            placeholder="Write in markdown… use [[Note title]] to link notes."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck
          />
        )}
        {mode !== 'edit' && (
          <div className="flex-1 overflow-y-auto p-6">
            {body.trim() ? (
              <Suspense
                fallback={
                  <p className="text-sm text-[var(--color-muted)]">Loading preview…</p>
                }
              >
                <Markdown body={body} onWikiLink={onWikiLink} />
              </Suspense>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Nothing to preview yet.
              </p>
            )}

            {backlinks.length > 0 && (
              <div className="mt-8 border-t border-[var(--color-border)] pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Linked references · {backlinks.length}
                </p>
                <div className="flex flex-col gap-1">
                  {backlinks.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onWikiLink(n.title)}
                      className="rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-2)]"
                    >
                      <span className="font-medium">{n.title}</span>
                      <span className="ml-2 text-xs text-[var(--color-muted)]">
                        {prettyDate(new Date(n.updatedAt).toISOString().slice(0, 10))}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
