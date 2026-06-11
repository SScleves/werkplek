import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { Button, inputClass } from '../components/ui'

export function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    setInfo('')
    if (!email.trim() || password.length < 6) {
      setError('Enter an email and a password of at least 6 characters.')
      return
    }
    setBusy(true)
    const fn = mode === 'in' ? signIn : signUp
    const { error } = await fn(email.trim(), password)
    setBusy(false)
    if (error) {
      setError(error)
    } else if (mode === 'up') {
      setInfo(
        'Account created. If email confirmation is on, check your inbox — otherwise you can sign in now.',
      )
      setMode('in')
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-xl font-bold text-white">
            W
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Werkplek</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {mode === 'in' ? 'Sign in to your space' : 'Create your account'}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}
          {info && <p className="text-sm text-[var(--color-accent)]">{info}</p>}

          <Button
            variant="primary"
            onClick={submit}
            disabled={busy}
            className="w-full justify-center py-2.5"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {mode === 'in' ? 'Sign in' : 'Create account'}
          </Button>

          <button
            onClick={() => {
              setMode((m) => (m === 'in' ? 'up' : 'in'))
              setError('')
              setInfo('')
            }}
            className="text-center text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            {mode === 'in'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
          Your data syncs securely to the cloud and is private to your account.
        </p>
      </div>
    </div>
  )
}
