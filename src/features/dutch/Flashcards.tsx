import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { VocabCard } from '../../db/db'
import { distractors, shuffle } from '../../lib/dutch'
import { SpeakButton } from './SpeakButton'

export function Flashcards({
  cards,
  all,
  onReview,
  onDone,
}: {
  cards: VocabCard[]
  all: VocabCard[]
  onReview: (card: VocabCard, correct: boolean) => void
  onDone: () => void
}) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const card = cards[i]

  const options = useMemo(() => {
    if (!card) return []
    return shuffle([card.english, ...distractors(card, all, 3)])
  }, [card, all])

  if (!card) return null

  const choose = (opt: string) => {
    if (picked) return
    setPicked(opt)
    const correct = opt === card.english
    onReview(card, correct)
    setTimeout(() => {
      if (i + 1 >= cards.length) onDone()
      else {
        setI(i + 1)
        setPicked(null)
      }
    }, 950)
  }

  return (
    <div className="flex flex-col items-center">
      <Progress i={i} total={cards.length} />
      <p className="mb-1 mt-8 text-xs uppercase tracking-wide text-[var(--color-muted)]">
        What does this mean?
      </p>
      <div className="flex items-center gap-2">
        <h2 className="text-4xl font-semibold">{card.dutch}</h2>
        <SpeakButton text={card.dutch} size={20} />
      </div>
      {card.example && (
        <p className="mt-2 text-sm italic text-[var(--color-muted)]">
          “{card.example}”
        </p>
      )}

      <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const isCorrect = opt === card.english
          const show = picked !== null
          const state = !show
            ? 'idle'
            : isCorrect
              ? 'correct'
              : opt === picked
                ? 'wrong'
                : 'dim'
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={show}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                state === 'correct'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                  : state === 'wrong'
                    ? 'border-red-500 bg-red-500/10 text-red-600'
                    : state === 'dim'
                      ? 'border-[var(--color-border)] opacity-50'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {opt}
              {state === 'correct' && <Check size={16} />}
              {state === 'wrong' && <X size={16} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Progress({ i, total }: { i: number; total: number }) {
  return (
    <div className="flex w-full max-w-md items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${(i / total) * 100}%` }}
        />
      </div>
      <span className="text-xs text-[var(--color-muted)]">
        {i + 1}/{total}
      </span>
    </div>
  )
}
