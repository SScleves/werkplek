import { db } from '../db/db'
import { dumpAll, loadAll } from './backup'
import { ensureSeeded } from '../db/seed'
import { supabase } from './supabase'
import { useSync } from '../store/sync'

const OWNER_KEY = 'flowdeck-local-owner'

// Module-level sync state (one active session at a time)
let suppress = false // true while applying a remote snapshot (don't echo back)
let dirty = false
let hydrated = false
let pushTimer: ReturnType<typeof setTimeout> | undefined
let currentUser: string | null = null

const setStatus = useSync.getState().set
const PUSH_DEBOUNCE = 2500

async function pull(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('snapshots')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return false // no cloud snapshot yet
  suppress = true
  try {
    await loadAll(data.data as { app?: string; data?: Record<string, unknown[]> })
  } finally {
    suppress = false
  }
  return true
}

async function push(userId: string): Promise<void> {
  if (!navigator.onLine) {
    setStatus('offline')
    dirty = true
    return
  }
  setStatus('syncing')
  try {
    const snapshot = await dumpAll()
    const { error } = await supabase.from('snapshots').upsert({
      user_id: userId,
      data: snapshot,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    dirty = false
    setStatus('saved', Date.now())
  } catch (e) {
    console.error('[sync] push failed', e)
    setStatus('error')
    dirty = true
  }
}

function schedulePush() {
  if (!currentUser || !hydrated || suppress) return
  dirty = true
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => currentUser && push(currentUser), PUSH_DEBOUNCE)
}

// ---- Dexie change tracking ------------------------------------------------

type Hooked = { unsub: () => void }
let hooks: Hooked[] = []

function registerHooks() {
  const mark = () => schedulePush()
  for (const table of db.tables) {
    const creating = () => mark()
    const updating = () => mark()
    const deleting = () => mark()
    table.hook('creating', creating)
    table.hook('updating', updating)
    table.hook('deleting', deleting)
    hooks.push({
      unsub: () => {
        table.hook('creating').unsubscribe(creating)
        table.hook('updating').unsubscribe(updating)
        table.hook('deleting').unsubscribe(deleting)
      },
    })
  }
}

function unregisterHooks() {
  hooks.forEach((h) => h.unsub())
  hooks = []
}

// ---- Lifecycle ------------------------------------------------------------

const onOnline = () => {
  if (dirty && currentUser) push(currentUser)
}
const onOffline = () => setStatus('offline')
const onVisible = () => {
  if (!currentUser) return
  if (document.hidden) {
    // Leaving the tab — flush any pending edits now instead of waiting.
    if (dirty) {
      clearTimeout(pushTimer)
      push(currentUser)
    }
  } else if (!dirty) {
    // Returning with no local edits — pull remote changes from other devices.
    pull(currentUser).catch((e) => console.error('[sync] focus pull', e))
  }
}

async function resetToFreshSeed(): Promise<void> {
  suppress = true
  try {
    await db.transaction('rw', db.tables, async () => {
      for (const t of db.tables) await t.clear()
    })
    await ensureSeeded()
  } finally {
    suppress = false
  }
}

export async function startSync(userId: string): Promise<void> {
  currentUser = userId
  hydrated = false
  setStatus('syncing')
  try {
    const hadCloud = await pull(userId)
    if (hadCloud) {
      setStatus('saved', Date.now())
    } else {
      // No cloud snapshot for this account yet. Only adopt the current local
      // data as the seed if it isn't another account's data on this browser.
      const owner = localStorage.getItem(OWNER_KEY)
      if (owner && owner !== userId) await resetToFreshSeed()
      await push(userId)
    }
    localStorage.setItem(OWNER_KEY, userId)
  } catch (e) {
    console.error('[sync] initial sync failed', e)
    setStatus('error')
  }
  hydrated = true
  registerHooks()
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  document.addEventListener('visibilitychange', onVisible)
}

export function stopSync(): void {
  clearTimeout(pushTimer)
  unregisterHooks()
  window.removeEventListener('online', onOnline)
  window.removeEventListener('offline', onOffline)
  document.removeEventListener('visibilitychange', onVisible)
  currentUser = null
  hydrated = false
  dirty = false
  setStatus('idle')
}

/** Force an immediate push (used by a manual "sync now" button). */
export async function syncNow(): Promise<void> {
  if (currentUser) await push(currentUser)
}
