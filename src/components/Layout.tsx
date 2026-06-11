import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MiniTimer } from '../features/pomodoro/MiniTimer'
import { CommandPalette } from './CommandPalette'
import { Toaster } from './Toaster'

export function Layout() {
  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <MiniTimer />
      <CommandPalette />
      <Toaster />
    </div>
  )
}
