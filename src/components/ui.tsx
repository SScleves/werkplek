/* eslint-disable react-refresh/only-export-components -- shared UI kit: exports components alongside class-string constants and hooks */
import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'

// ---- Button ---------------------------------------------------------------

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger'

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-50',
  ghost:
    'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]',
  subtle:
    'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:brightness-95',
  danger: 'bg-red-500 text-white hover:bg-red-600',
}

export function Button({
  variant = 'subtle',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function IconButton({
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

// ---- Inputs ---------------------------------------------------------------

export const inputClass =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] transition'

// ---- Card -----------------------------------------------------------------

export function Card({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}
    >
      {children}
    </div>
  )
}

// ---- Modal ----------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh]"
      onMouseDown={onClose}
    >
      <div
        className={`fd-pop w-full ${width} rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <h2 className="text-sm font-semibold">{title}</h2>
            <IconButton onClick={onClose} aria-label="Close">
              <X size={16} />
            </IconButton>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ---- Empty state ----------------------------------------------------------

export function Empty({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode
  title: string
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[var(--color-muted)]">
      {icon}
      <p className="text-sm font-medium text-[var(--color-text)]">{title}</p>
      {hint && <p className="max-w-xs text-xs">{hint}</p>}
    </div>
  )
}

// ---- Autofocus helper -----------------------------------------------------

export function useAutoFocus<T extends HTMLElement>(active = true) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (active) ref.current?.focus()
  }, [active])
  return ref
}
