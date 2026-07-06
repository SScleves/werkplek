import { useRef, useState } from 'react'
import { Download, Upload, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button, Card, inputClass } from '../components/ui'
import { useSettings } from '../hooks'
import { db } from '../db/db'
import { exportAll, importAll } from '../lib/backup'
import { PROJECT_COLORS } from '../lib/tasks'

function Row({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const settings = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  if (!settings) return null

  const update = (patch: Partial<typeof settings>) =>
    db.settings.update('settings', patch)

  const onImport = async (file: File) => {
    try {
      await importAll(file)
      setMsg('Backup restored ✓')
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Preferences are stored on this device" />
      <div className="mx-auto max-w-2xl px-8 py-6">
        {/* Appearance */}
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Appearance
        </h2>
        <Card className="mb-6 divide-y divide-[var(--color-border)] px-5">
          <Row label="Theme">
            <div className="flex gap-1 rounded-lg bg-[var(--color-surface-2)] p-1">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => update({ theme: t })}
                  className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                    settings.theme === t
                      ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                      : 'text-[var(--color-muted)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Accent color">
            <div className="flex gap-1.5">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ accent: c })}
                  className={`h-6 w-6 rounded-full transition ${
                    settings.accent === c
                      ? 'ring-2 ring-[var(--color-text)] ring-offset-2 ring-offset-[var(--color-surface)]'
                      : ''
                  }`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </Row>
        </Card>

        {/* Pomodoro */}
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Pomodoro
        </h2>
        <Card className="mb-6 divide-y divide-[var(--color-border)] px-5">
          {(
            [
              ['work', 'Focus length', 'minutes'],
              ['short', 'Short break', 'minutes'],
              ['long', 'Long break', 'minutes'],
              ['longEvery', 'Long break every', 'focus sessions'],
            ] as const
          ).map(([key, label, unit]) => (
            <Row key={key} label={label} hint={unit}>
              <input
                type="number"
                min={1}
                value={settings.pomodoro[key]}
                onChange={(e) =>
                  update({
                    pomodoro: {
                      ...settings.pomodoro,
                      [key]: Math.max(1, Number(e.target.value) || 1),
                    },
                  })
                }
                className={`${inputClass} w-20 text-center`}
              />
            </Row>
          ))}
          <Row label="Sound" hint="Play a chime when a session ends">
            <Toggle
              on={settings.soundOn}
              onClick={() => update({ soundOn: !settings.soundOn })}
            />
          </Row>
          <Row
            label="Notifications"
            hint="Browser notification when a session ends"
          >
            <Toggle
              on={settings.notificationsOn}
              onClick={async () => {
                if (!settings.notificationsOn && 'Notification' in window)
                  await Notification.requestPermission()
                update({ notificationsOn: !settings.notificationsOn })
              }}
            />
          </Row>
        </Card>

        {/* Data */}
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Data
        </h2>
        <Card className="px-5">
          <Row
            label="Backup"
            hint="Everything lives in this browser. Export regularly."
          >
            <div className="flex gap-2">
              <Button onClick={() => exportAll()}>
                <Download size={15} /> Export
              </Button>
              <Button onClick={() => fileRef.current?.click()}>
                <Upload size={15} /> Import
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onImport(f)
                  e.target.value = ''
                }}
              />
            </div>
          </Row>
          <Row label="Reset" hint="Delete all Werkplek data on this device">
            <Button
              variant="danger"
              onClick={async () => {
                if (
                  confirm('Delete ALL data? This cannot be undone (export first!).')
                ) {
                  await db.delete()
                  location.reload()
                }
              }}
            >
              <Trash2 size={15} /> Reset
            </Button>
          </Row>
        </Card>

        {msg && (
          <p className="mt-4 text-sm text-[var(--color-accent)]">{msg}</p>
        )}
      </div>
    </>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition ${
        on ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-2)]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}
