import { useMemo, useState } from 'react'
import type { VocabCard } from '../../db/db'
import { shuffle } from '../../lib/dutch'
import { speakDutch } from '../../lib/speech'

type Side = 'nl' | 'en'
type Sel = { side: Side; id: string } | null

export function WordMatch({
  cards,
  onReview,
  onDone,
}: {
  cards: VocabCard[]
  onReview: (card: VocabCard, correct: boolean) => void
  onDone: () => void
}) {
  const left = useMemo(() => shuffle(cards), [cards])
  const right = useMemo(() => shuffle(cards), [cards])
  const [first, setFirst] = useState<Sel>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<string[]>([])

  const click = (side: Side, id: string) => {
    if (matched.has(id) || wrong.length) return
    if (!first) {
      setFirst({ side, id })
      return
    }
    if (first.side === side) {
      setFirst({ side, id }) // reselect within the same column
      return
    }
    // second pick from the other column
    if (first.id === id) {
      const card = cards.find((c) => c.id === id)!
      const next = new Set(matched).add(id)
      setMatched(next)
      setFirst(null)
      speakDutch(card.dutch) // reinforce the sound on a correct match
      onReview(card, true)
      if (next.size === cards.length) setTimeout(onDone, 400)
    } else {
      setWrong([first.id, id])
      setTimeout(() => {
        setWrong([])
        setFirst(null)
      }, 650)
    }
  }

  const cls = (side: Side, id: string) => {
    if (matched.has(id))
      return 'border-emerald-500 bg-emerald-500/10 text-emerald-600 opacity-60'
    if (wrong.includes(id) && first?.side !== side)
      return 'border-red-500 bg-red-500/10 text-red-600'
    if (wrong.includes(id)) return 'border-red-500 bg-red-500/10 text-red-600'
    if (first?.side === side && first.id === id)
      return 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
    return 'border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)]'
  }

  return (
    <div className="w-full max-w-xl">
      <p className="mb-6 text-center text-sm text-[var(--color-muted)]">
        Match each Dutch word to its English meaning ·{' '}
        <span className="font-medium text-[var(--color-text)]">
          {matched.size}/{cards.length}
        </span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {left.map((c) => (
            <button
              key={c.id}
              onClick={() => click('nl', c.id)}
              disabled={matched.has(c.id)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${cls(
                'nl',
                c.id,
              )}`}
            >
              {c.dutch}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {right.map((c) => (
            <button
              key={c.id}
              onClick={() => click('en', c.id)}
              disabled={matched.has(c.id)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${cls(
                'en',
                c.id,
              )}`}
            >
              {c.english}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
