import { Cloud, CloudOff, RefreshCw, Check, LogOut, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useSync } from '../store/sync'
import { syncNow } from '../lib/sync'

export function SyncStatus() {
  const { user, signOut } = useAuth()
  const status = useSync((s) => s.status)

  const meta = {
    idle: { icon: Cloud, label: 'Connected', cls: 'text-[var(--color-muted)]' },
    syncing: { icon: RefreshCw, label: 'Syncing…', cls: 'text-[var(--color-accent)]' },
    saved: { icon: Check, label: 'All synced', cls: 'text-emerald-500' },
    error: { icon: AlertCircle, label: 'Sync error — retry', cls: 'text-red-500' },
    offline: { icon: CloudOff, label: 'Offline — will sync', cls: 'text-amber-500' },
  }[status]
  const Icon = meta.icon

  return (
    <div className="border-t border-[var(--color-border)] px-3 py-2.5">
      <button
        onClick={() => syncNow()}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-[var(--color-surface-2)] ${meta.cls}`}
        title="Sync now"
      >
        <Icon size={14} className={status === 'syncing' ? 'animate-spin' : ''} />
        {meta.label}
      </button>
      <div className="mt-1 flex items-center justify-between gap-2 px-2">
        <span className="truncate text-[11px] text-[var(--color-muted)]" title={user?.email}>
          {user?.email}
        </span>
        <button
          onClick={() => signOut()}
          className="flex shrink-0 items-center gap-1 text-[11px] text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </div>
  )
}
