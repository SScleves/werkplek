import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useToast } from '../store/toast'

export function Toaster() {
  const toast = useToast((s) => s.toast)
  const dismiss = useToast((s) => s.dismiss)

  // Auto-dismiss after 6s (timer resets per toast via toast.id)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(dismiss, 6000)
    return () => clearTimeout(t)
  }, [toast, dismiss])

  if (!toast) return null

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="fd-pop pointer-events-auto flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-4 pr-2 shadow-xl">
        <span className="text-sm">{toast.message}</span>
        {toast.actionLabel && (
          <button
            onClick={async () => {
              await toast.onAction?.()
              dismiss()
            }}
            className="rounded-lg bg-[var(--color-accent-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-accent)] hover:brightness-95"
          >
            {toast.actionLabel}
          </button>
        )}
        <button
          onClick={dismiss}
          className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
