import { useLocation, useNavigate } from 'react-router-dom'
import { Pause, X, GraduationCap } from 'lucide-react'
import { usePomodoro, fmtTime } from '../../store/pomodoro'

const MODE_LABEL = { work: 'Focus', short: 'Short break', long: 'Long break' }
const MODE_COLOR = { work: '#4f6ef7', short: '#10b981', long: '#8b5cf6' }

/** Floating timer pill — visible everywhere except the Focus page. */
export function MiniTimer() {
  const location = useLocation()
  const navigate = useNavigate()
  const mode = usePomodoro((s) => s.mode)
  const remaining = usePomodoro((s) => s.remaining)
  const running = usePomodoro((s) => s.running)
  const justFinished = usePomodoro((s) => s.justFinished)
  const toggle = usePomodoro((s) => s.toggle)
  const clear = usePomodoro((s) => s.clearJustFinished)

  if (location.pathname === '/focus') return null
  if (!running && !justFinished) return null

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {justFinished ? (
        <div className="fd-pop flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 pl-4 shadow-xl">
          <span className="text-sm font-medium">
            {justFinished === 'work' ? 'Nice focus! Break time.' : 'Break over!'}
          </span>
          {justFinished === 'work' && (
            <button
              onClick={() => {
                clear()
                navigate('/dutch')
              }}
              className="flex items-center gap-1 rounded-lg bg-[var(--color-accent-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-accent)]"
            >
              <GraduationCap size={14} /> Dutch break
            </button>
          )}
          <button
            onClick={clear}
            className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate('/focus')}
          className="fd-pop flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-4 pr-2 shadow-xl"
        >
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: MODE_COLOR[mode] }}
          >
            {fmtTime(remaining)}
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            {MODE_LABEL[mode]}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation()
              toggle()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text)]"
          >
            <Pause size={14} />
          </span>
        </button>
      )}
    </div>
  )
}
