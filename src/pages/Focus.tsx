import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  GraduationCap,
  Flame,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui'
import { usePomodoro, fmtTime, durationFor } from '../store/pomodoro'
import { useTasks } from '../hooks'
import { db } from '../db/db'
import { toDateStr } from '../lib/date'
import type { PomodoroType } from '../db/db'

const MODES: { key: PomodoroType; label: string; color: string }[] = [
  { key: 'work', label: 'Focus', color: '#4f6ef7' },
  { key: 'short', label: 'Short break', color: '#10b981' },
  { key: 'long', label: 'Long break', color: '#8b5cf6' },
]

export function FocusPage() {
  const navigate = useNavigate()
  const tasks = useTasks()
  const s = usePomodoro()
  const total = durationFor(s.mode, s.durations)
  const progress = 1 - s.remaining / total
  const color = MODES.find((m) => m.key === s.mode)!.color

  const openTasks = useMemo(
    () => tasks.filter((t) => !t.done).sort((a, b) => b.order - a.order),
    [tasks],
  )
  const selectedTask = tasks.find((t) => t.id === s.taskId)

  const todayCount = useLiveQuery(async () => {
    const today = toDateStr(new Date())
    const all = await db.pomodoros.toArray()
    return all.filter(
      (p) => p.type === 'work' && toDateStr(new Date(p.startedAt)) === today,
    ).length
  }, [s.justFinished])

  const ring = 2 * Math.PI * 130

  return (
    <>
      <PageHeader
        title="Focus"
        subtitle="Pomodoro timer — attach a task and get in the zone"
      />
      <div className="mx-auto flex max-w-md flex-col items-center px-8 py-8">
        {/* Mode tabs */}
        <div className="mb-8 flex rounded-xl bg-[var(--color-surface-2)] p-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => s.setMode(m.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                s.mode === m.key
                  ? 'bg-[var(--color-surface)] shadow-sm'
                  : 'text-[var(--color-muted)]'
              }`}
              style={s.mode === m.key ? { color: m.color } : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Ring */}
        <div className="relative h-72 w-72">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 280 280">
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="none"
              stroke="var(--color-surface-2)"
              strokeWidth="12"
            />
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-light tabular-nums tracking-tight">
              {fmtTime(s.remaining)}
            </span>
            <span className="mt-1 text-sm text-[var(--color-muted)]">
              {s.running ? 'In progress' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center gap-3">
          <Button variant="ghost" onClick={s.reset} aria-label="Reset">
            <RotateCcw size={18} />
          </Button>
          <button
            onClick={s.toggle}
            className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition hover:opacity-90"
            style={{ background: color }}
          >
            {s.running ? <Pause size={26} /> : <Play size={26} className="ml-1" />}
          </button>
          <Button variant="ghost" onClick={s.skip} aria-label="Skip">
            <SkipForward size={18} />
          </Button>
        </div>

        {/* Session dots */}
        <div className="mt-6 flex items-center gap-1.5">
          {Array.from({ length: s.durations.longEvery }).map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < s.workSessions % s.durations.longEvery ||
                (s.workSessions > 0 &&
                  s.workSessions % s.durations.longEvery === 0)
                  ? 'bg-[var(--color-accent)]'
                  : 'bg-[var(--color-surface-2)]'
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-[var(--color-muted)]">
            until long break
          </span>
        </div>

        {/* Task picker */}
        <div className="mt-8 w-full">
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
            Working on
          </label>
          <select
            value={s.taskId ?? ''}
            onChange={(e) => s.selectTask(e.target.value || null)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          >
            <option value="">No task — just focus</option>
            {openTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          {selectedTask && selectedTask.pomodorosDone > 0 && (
            <p className="mt-2 flex items-center gap-1 text-xs text-[var(--color-muted)]">
              <Flame size={12} /> {selectedTask.pomodorosDone} pomodoros on this
              task
            </p>
          )}
        </div>

        {/* Today stat */}
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-text)]">
            {todayCount ?? 0}
          </span>{' '}
          focus sessions completed today
        </p>

        {/* Break handoff */}
        {s.justFinished === 'work' && (
          <div className="fd-pop mt-6 flex w-full flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center">
            <p className="text-sm font-medium">
              Great work! 🌿 Take a real break — learn a few Dutch words?
            </p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  s.clearJustFinished()
                  navigate('/dutch')
                }}
              >
                <GraduationCap size={16} /> Dutch break
              </Button>
              <Button variant="ghost" onClick={s.clearJustFinished}>
                Just rest
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
