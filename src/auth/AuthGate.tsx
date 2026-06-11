import { useEffect, useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cloudEnabled } from '../cloudConfig'
import { AuthProvider, useAuth } from './AuthProvider'
import { LoginScreen } from './LoginScreen'
import { startSync, stopSync } from '../lib/sync'

function Splash({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-[var(--color-muted)]">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  )
}

/** Starts cloud sync for the signed-in user and waits for the first
 *  hydration before revealing the app, so no stale local data flashes. */
function SyncBoundary({ userId, children }: { userId: string; children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    startSync(userId).finally(() => active && setReady(true))
    return () => {
      active = false
      stopSync()
    }
  }, [userId])

  if (!ready) return <Splash label="Syncing your data…" />
  return <>{children}</>
}

function Inner({ children }: { children: ReactNode }) {
  const { loading, session, user } = useAuth()
  if (loading) return <Splash label="Loading…" />
  if (!session || !user) return <LoginScreen />
  return <SyncBoundary userId={user.id}>{children}</SyncBoundary>
}

export function AuthGate({ children }: { children: ReactNode }) {
  // Local-only mode (no Supabase keys configured): no login, no sync.
  if (!cloudEnabled()) return <>{children}</>
  return (
    <AuthProvider>
      <Inner>{children}</Inner>
    </AuthProvider>
  )
}
