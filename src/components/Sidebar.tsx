import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  LayoutGrid,
  Calendar,
  FileText,
  Timer,
  GraduationCap,
  Settings as SettingsIcon,
  Sun,
  Moon,
} from 'lucide-react'
import { useSettings } from '../hooks'
import { db } from '../db/db'
import { IconButton } from './ui'
import { cloudEnabled } from '../cloudConfig'
import { SyncStatus } from './SyncStatus'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/todos', label: 'Todos', icon: CheckSquare },
  { to: '/boards', label: 'Boards', icon: LayoutGrid },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/dutch', label: 'Dutch', icon: GraduationCap },
]

export function Sidebar() {
  const settings = useSettings()
  const isDark =
    settings?.theme === 'dark' ||
    (settings?.theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark'
    await db.settings.update('settings', { theme: next })
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-white">
          W
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Werkplek</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] px-3 py-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`
          }
        >
          <SettingsIcon size={17} />
          Settings
        </NavLink>
        <IconButton onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </IconButton>
      </div>

      {cloudEnabled() && <SyncStatus />}
    </aside>
  )
}
