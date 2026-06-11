import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'offline'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: number | null
  set: (status: SyncStatus, lastSyncedAt?: number) => void
}

export const useSync = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  set: (status, lastSyncedAt) =>
    set((s) => ({
      status,
      lastSyncedAt: lastSyncedAt ?? s.lastSyncedAt,
    })),
}))
