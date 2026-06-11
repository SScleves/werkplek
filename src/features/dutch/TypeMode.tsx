import { useState } from 'react'
import { Check, X, ArrowRight } from 'lucide-react'
import type { VocabCard } from '../../db/db'
import { matchesAnswer } from '../../lib/dutch'
import { Button, inputClass, useAutoFocus } from '../../components/ui'
import { Progress } from './Flashcards'
import { SpeakButton } from './SpeakButton'

export function TypeMode({
  cards,
  onReview,
  onDone,
}: {
  cards: VocabCard[]
  onReview: (card: VocabCard, correct: boolean) => void
  onDone: () => void
}) {
  const [i, setI] = useState(0)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const inputRef = useAutoFocus<HTMLInputElement>(true)
  const card = cards[i]

  if (!card) return null

  const submit = () => {
    if (result) {
      next()
      return
    }
    if (!value.trim()) return
    const correct = matchesAnswer(value, card.english)
    setResult(correct ? 'correct' : 'wrong')
    onReview(card, correct)
  }

  const next = () => {
    if (i + 1 >= cards.length) return onDone()
    setI(i + 1)
    setValue('')
    setResult(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="flex flex-col items-center">
      <Progress i={i} total={cards.length} />
      <p className="mb-1 mt-8 text-xs uppercase tracking-wide text-[var(--color-muted)]">
        Type the English meaning
      </p>
      <div className="flex items-center gap-2">
        <h2 className="text-4xl font-semibold">{card.dutch}</h2>
        <SpeakButton text={card.dutch} size={20} />
      </div>

      <div className="mt-8 w-full max-w-sm">
        <input
          ref={inputRef}
          className={`${inputClass} text-center text-lg ${
            result === 'correct'
              ? 'border-emerald-500'
              : result === 'wrong'
                ? 'border-red-500'
                : ''
          }`}
          placeholder="your answer…"
          value={value}
          disabled={result !== null}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />

        {result && (
          <div
            className={`fd-pop mt-3 flex items-center justify-center gap-2 text-sm font-medium ${
              result === 'correct' ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {result === 'correct' ? (
              <>
                <Check size={16} /> Correct!
              </>
            ) : (
              <>
                <X size={16} /> Answer: <strong>{card.english}</strong>
              </>
            )}
          </div>
        )}

        <Button
          variant="primary"
          onClick={submit}
          className="mt-5 w-full justify-center py-2.5"
          disabled={!value.trim() && !result}
        >
          {result ? (
            <>
              {i + 1 >= cards.length ? 'Finish' : 'Next'} <ArrowRight size={16} />
            </>
          ) : (
            'Check'
          )}
        </Button>
      </div>
    </div>
  )
}
