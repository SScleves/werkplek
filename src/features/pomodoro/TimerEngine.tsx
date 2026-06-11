import { useEffect, useRef } from 'react'
import { usePomodoro, fmtTime } from '../../store/pomodoro'
import { useSettings } from '../../hooks'
import { playChime } from '../../lib/sound'

const MODE_LABEL = { work: 'Focus', short: 'Break', long: 'Long break' }

/** Headless component: drives the global pomodoro timer + side effects. */
export function TimerEngine() {
  const settings = useSettings()
  const running = usePomodoro((s) => s.running)
  const remaining = usePomodoro((s) => s.remaining)
  const mode = usePomodoro((s) => s.mode)
  const justFinished = usePomodoro((s) => s.justFinished)
  const tick = usePomodoro((s) => s.tick)
  const configure = usePomodoro((s) => s.configure)
  const prevFinished = useRef<typeof justFinished>(null)

  // Sync durations from settings
  useEffect(() => {
    if (settings) configure(settings.pomodoro)
  }, [settings, configure])

  // Tick every second while running; also resync immediately when the tab
  // regains focus (background tabs throttle intervals).
  useEffect(() => {
    if (!running) return
    const id = setInterval(tick, 1000)
    const onVisible = () => {
      if (!document.hidden) tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [running, tick])

  // Tab title reflects the timer
  useEffect(() => {
    if (running) document.title = `${fmtTime(remaining)} · ${MODE_LABEL[mode]} — Werkplek`
    else document.title = 'Werkplek — your command center'
    return () => {
      document.title = 'Werkplek — your command center'
    }
  }, [running, remaining, mode])

  // Chime + notification when a session completes
  useEffect(() => {
    if (justFinished && justFinished !== prevFinished.current) {
      if (settings?.soundOn) playChime()
      if (
        settings?.notificationsOn &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const msg =
          justFinished === 'work'
            ? 'Focus session done — time for a break! 🌿'
            : 'Break over — back to focus 💪'
        new Notification('Werkplek', { body: msg })
      }
    }
    prevFinished.current = justFinished
  }, [justFinished, settings])

  return null
}
