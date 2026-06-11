import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button, Modal, inputClass, useAutoFocus, Empty } from '../../components/ui'
import {
  createVocab,
  updateVocab,
  deleteVocab,
  importVocabLines,
  type VocabInput,
} from '../../lib/dutch'
import { todayStr } from '../../lib/date'
import type { VocabCard } from '../../db/db'
import { SpeakButton } from './SpeakButton'

export function VocabManager({
  cards,
  themes,
  onBack,
}: {
  cards: VocabCard[]
  themes: string[]
  onBack: () => void
}) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<VocabCard | null | 'new'>(null)
  const [importing, setImporting] = useState(false)

  const allThemes = useMemo(
    () => [...new Set([...themes, ...cards.map((c) => c.theme)])],
    [themes, cards],
  )

  const grouped = useMemo(() => {
    const q = query.toLowerCase().trim()
    const filtered = q
      ? cards.filter(
          (c) =>
            c.dutch.toLowerCase().includes(q) ||
            c.english.toLowerCase().includes(q) ||
            c.theme.toLowerCase().includes(q),
        )
      : cards
    const map: Record<string, VocabCard[]> = {}
    for (const c of filtered) (map[c.theme] ??= []).push(c)
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
  }, [cards, query])

  const today = todayStr()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-8 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-lg font-semibold">Manage deck</h1>
        <span className="text-sm text-[var(--color-muted)]">
          {cards.length} words
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="subtle" onClick={() => setImporting(true)}>
            <Upload size={15} /> Import
          </Button>
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus size={16} /> Add word
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-8 py-5">
        <div className="relative mb-4">
          <Search
            size={15}
            className="absolute left-3 top-2.5 text-[var(--color-muted)]"
          />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search words…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {grouped.length === 0 ? (
          <Empty title="No words found" hint="Try a different search, or add a word." />
        ) : (
          grouped.map(([theme, list]) => (
            <section key={theme} className="mb-5">
              <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                {theme} · {list.length}
              </h3>
              <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                {list.map((c, i) => (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-3 px-4 py-2.5 ${
                      i > 0 ? 'border-t border-[var(--color-border)]' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{c.dutch}</span>
                      <span className="mx-2 text-[var(--color-muted)]">—</span>
                      <span className="text-[var(--color-muted)]">{c.english}</span>
                    </div>
                    {c.dueDate <= today && (
                      <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
                        due
                      </span>
                    )}
                    <div className="flex opacity-0 transition group-hover:opacity-100">
                      <SpeakButton text={c.dutch} size={14} className="p-1.5" />
                      <button
                        onClick={() => setEditing(c)}
                        className="rounded p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${c.dutch}"?`)) deleteVocab(c.id)
                        }}
                        className="rounded p-1.5 text-[var(--color-muted)] hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <VocabEditor
        open={editing !== null}
        card={editing === 'new' ? null : editing}
        themes={allThemes}
        onClose={() => setEditing(null)}
      />
      <ImportModal
        open={importing}
        themes={allThemes}
        onClose={() => setImporting(false)}
      />
    </div>
  )
}

function VocabEditor({
  open,
  card,
  themes,
  onClose,
}: {
  open: boolean
  card: VocabCard | null
  themes: string[]
  onClose: () => void
}) {
  const ref = useAutoFocus<HTMLInputElement>(open)
  const [form, setForm] = useState<VocabInput>({
    dutch: '',
    english: '',
    theme: '',
    example: '',
  })

  /* eslint-disable react-hooks/set-state-in-effect -- intentional: seed form state when the modal (re)opens */
  useEffect(() => {
    if (!open) return
    setForm({
      dutch: card?.dutch ?? '',
      english: card?.english ?? '',
      theme: card?.theme ?? themes[0] ?? 'Custom',
      example: card?.example ?? '',
    })
  }, [open, card]) // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    if (!form.dutch.trim() || !form.english.trim()) return
    if (card)
      await updateVocab(card.id, {
        dutch: form.dutch.trim(),
        english: form.english.trim(),
        theme: form.theme.trim() || 'Custom',
        example: form.example?.trim() || undefined,
      })
    else await createVocab(form)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card ? 'Edit word' : 'Add word'}
      width="max-w-sm"
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
          Dutch
          <input
            ref={ref}
            className={inputClass}
            value={form.dutch}
            onChange={(e) => setForm({ ...form, dutch: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
          English
          <input
            className={inputClass}
            value={form.english}
            onChange={(e) => setForm({ ...form, english: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
          Topic
          <input
            className={inputClass}
            list="vocab-themes"
            value={form.theme}
            onChange={(e) => setForm({ ...form, theme: e.target.value })}
          />
          <datalist id="vocab-themes">
            {themes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
          Example (optional)
          <input
            className={inputClass}
            value={form.example}
            onChange={(e) => setForm({ ...form, example: e.target.value })}
          />
        </label>
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={save}
            disabled={!form.dutch.trim() || !form.english.trim()}
          >
            {card ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ImportModal({
  open,
  themes,
  onClose,
}: {
  open: boolean
  themes: string[]
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [theme, setTheme] = useState(themes[0] ?? 'Custom')
  const [done, setDone] = useState<number | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect -- intentional: reset form state when the modal (re)opens */
  useEffect(() => {
    if (open) {
      setText('')
      setDone(null)
      setTheme('Imported')
    }
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  const run = async () => {
    const n = await importVocabLines(text, theme.trim() || 'Imported')
    setDone(n)
    if (n > 0) setText('')
  }

  return (
    <Modal open={open} onClose={onClose} title="Import words" width="max-w-md">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-[var(--color-muted)]">
          One word per line as <code>dutch, english</code> (comma, semicolon, tab,
          or “ - ” all work).
        </p>
        <textarea
          className={`${inputClass} min-h-40 resize-y font-mono text-xs`}
          placeholder={'hond, dog\nkat, cat\nhuis, house'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
          Topic for these words
          <input
            className={inputClass}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
        </label>
        {done !== null && (
          <p className="text-sm text-[var(--color-accent)]">
            Imported {done} word{done === 1 ? '' : 's'} ✓
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={run} disabled={!text.trim()}>
            Import
          </Button>
        </div>
      </div>
    </Modal>
  )
}
