import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TimerEngine } from './features/pomodoro/TimerEngine'
import { AuthGate } from './auth/AuthGate'
import { ensureSeeded } from './db/seed'
import { useSettings } from './hooks'
import { Dashboard } from './pages/Dashboard'
import { TodosPage } from './pages/Todos'
import { BoardsPage } from './pages/Boards'
import { CalendarPage } from './pages/Calendar'
import { NotesPage } from './pages/Notes'
import { FocusPage } from './pages/Focus'
import { DutchPage } from './pages/Dutch'
import { SettingsPage } from './pages/Settings'

/** Applies the theme class to <html> based on settings + system preference. */
function ThemeManager() {
  const settings = useSettings()
  useEffect(() => {
    if (!settings) return
    const apply = () => {
      const wantDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', wantDark)
    }
    apply()
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [settings])

  useEffect(() => {
    if (settings?.accent)
      document.documentElement.style.setProperty(
        '--color-accent',
        settings.accent,
      )
  }, [settings?.accent])

  return null
}

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureSeeded().then(() => setReady(true))
  }, [])

  if (!ready)
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
        Loading FlowDeck…
      </div>
    )

  return (
    <>
      <ThemeManager />
      <AuthGate>
        <HashRouter>
          <TimerEngine />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="todos" element={<TodosPage />} />
              <Route path="boards" element={<BoardsPage />} />
              <Route path="boards/:projectId" element={<BoardsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="notes/:noteId" element={<NotesPage />} />
              <Route path="focus" element={<FocusPage />} />
              <Route path="dutch" element={<DutchPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthGate>
    </>
  )
}
