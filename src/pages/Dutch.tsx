import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Flame,
  Star,
  Layers,
  Keyboard,
  Shuffle,
  Trophy,
  ArrowLeft,
  RotateCcw,
  BookOpen,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button, Card } from '../components/ui'
import { Flashcards } from '../features/dutch/Flashcards'
import { TypeMode } from '../features/dutch/TypeMode'
import { WordMatch } from '../features/dutch/WordMatch'
import { VocabManager } from '../features/dutch/VocabManager'
import { db, type VocabCard } from '../db/db'
import { useGameStats } from '../hooks'
import {
  buildSession,
  dueCount,
  reviewCard,
  recordReview,
} from '../lib/dutch'
import { VOCAB_THEMES } from '../db/vocabSeed'

type Mode = 'flash' | 'type' | 'match'
type Screen = 'hub' | 'play' | 'summary' | 'manage'

const MODES: {
  key: Mode
  label: string
  desc: string
  icon: typeof Layers
  size: number
}[] = [
  { key: 'flash', label: 'Flashcard quiz', desc: 'Multiple choice', icon: Layers, size: 10 },
  { key: 'type', label: 'Type translation', desc: 'Recall & spell', icon: Keyboard, size: 10 },
  { key: 'match', label: 'Word match', desc: 'Match the pairs', icon: Shuffle, size: 6 },
]

export function DutchPage() {
  const vocab = useLiveQuery(() => db.vocab.toArray(), [], [])
  const stats = useGameStats()
  const [screen, setScreen] = useState<Screen>('hub')
  const [mode, setMode] = useState<Mode>('flash')
  const [theme, setTheme] = useState<string>('')
  const [session, setSession] = useState<VocabCard[]>([])
  const [correct, setCorrect] = useState(0)
  const [answered, setAnswered] = useState(0)

  const start = (m: Mode) => {
    const size = MODES.find((x) => x.key === m)!.size
    const cards = buildSession(vocab, size, theme || undefined)
    if (cards.length === 0) return
    setMode(m)
    setSession(cards)
    setCorrect(0)
    setAnswered(0)
    setScreen('play')
  }

  const handleReview = (card: VocabCard, isCorrect: boolean) => {
    reviewCard(card, isCorrect)
    recordReview(isCorrect)
    setAnswered((a) => a + 1)
    if (isCorrect) setCorrect((c) => c + 1)
  }

  const due = dueCount(vocab)

  // ---- Hub ----
  if (screen === 'hub') {
    return (
      <>
        <PageHeader
          title="Dutch break 🇳🇱"
          subtitle="A few minutes to learn — then back to work"
          actions={
            <Button variant="subtle" onClick={() => setScreen('manage')}>
              <BookOpen size={15} /> Manage deck
            </Button>
          }
        />
        <div className="mx-auto max-w-2xl px-8 py-6">
          {/* Stats */}
          <div className="mb-6 grid grid-cols-4 gap-3">
            <Stat icon={<Flame size={18} />} value={stats?.streak ?? 0} label="day streak" />
            <Stat icon={<Star size={18} />} value={stats?.xp ?? 0} label="XP" />
            <Stat icon={<Layers size={18} />} value={due} label="due now" />
            <Stat
              icon={<Trophy size={18} />}
              value={stats?.bestStreak ?? 0}
              label="best streak"
            />
          </div>

          {/* Theme filter */}
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">
              Topic
            </label>
            <div className="flex flex-wrap gap-1.5">
              <ThemeChip active={theme === ''} onClick={() => setTheme('')}>
                All
              </ThemeChip>
              {VOCAB_THEMES.map((t) => (
                <ThemeChip key={t} active={theme === t} onClick={() => setTheme(t)}>
                  {t}
                </ThemeChip>
              ))}
            </div>
          </div>

          {/* Modes */}
          <div className="grid gap-3 sm:grid-cols-3">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => start(m.key)}
                disabled={vocab.length === 0}
                className="flex flex-col items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:border-[var(--color-accent)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <m.icon size={20} />
                </span>
                <span className="font-semibold">{m.label}</span>
                <span className="text-xs text-[var(--color-muted)]">{m.desc}</span>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
            {vocab.length} words in your deck · spaced repetition keeps the tricky
            ones coming back
          </p>
        </div>
      </>
    )
  }

  // ---- Summary ----
  if (screen === 'summary') {
    const pct = answered ? Math.round((correct / answered) * 100) : 100
    return (
      <div className="flex h-full flex-col items-center justify-center px-8">
        <div className="fd-pop flex w-full max-w-sm flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <Trophy size={40} className="text-[var(--color-accent)]" />
          <h2 className="mt-4 text-2xl font-semibold">Sessie klaar! 🎉</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            You got {correct} of {answered} right ({pct}%)
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <Flame size={16} className="text-orange-500" />
            <span className="font-medium">{stats?.streak ?? 0} day streak</span>
            <span className="mx-2 text-[var(--color-muted)]">·</span>
            <Star size={16} className="text-amber-500" />
            <span className="font-medium">{stats?.xp ?? 0} XP</span>
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="primary" onClick={() => start(mode)}>
              <RotateCcw size={15} /> Again
            </Button>
            <Button variant="subtle" onClick={() => setScreen('hub')}>
              <ArrowLeft size={15} /> Done
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Manage deck ----
  if (screen === 'manage') {
    return (
      <VocabManager
        cards={vocab}
        themes={VOCAB_THEMES}
        onBack={() => setScreen('hub')}
      />
    )
  }

  // ---- Play ----
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-8 py-4">
        <button
          onClick={() => setScreen('hub')}
          className="flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={16} /> Quit
        </button>
      </div>
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-8 pb-10 pt-4">
        {mode === 'flash' && (
          <Flashcards
            cards={session}
            all={vocab}
            onReview={handleReview}
            onDone={() => setScreen('summary')}
          />
        )}
        {mode === 'type' && (
          <TypeMode
            cards={session}
            onReview={handleReview}
            onDone={() => setScreen('summary')}
          />
        )}
        {mode === 'match' && (
          <WordMatch
            cards={session}
            onReview={handleReview}
            onDone={() => setScreen('summary')}
          />
        )}
      </div>
    </div>
  )
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <Card className="flex flex-col items-center gap-1 py-4">
      <span className="text-[var(--color-accent)]">{icon}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-[11px] text-[var(--color-muted)]">{label}</span>
    </Card>
  )
}

function ThemeChip({
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
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
          : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {children}
    </button>
  )
}
