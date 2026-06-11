import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void | Promise<void>
}

interface ToastState {
  toast: Toast | null
  show: (t: Omit<Toast, 'id'>) => void
  dismiss: () => void
}

let nextId = 1

export const useToast = create<ToastState>((set) => ({
  toast: null,
  show: (t) => set({ toast: { ...t, id: nextId++ } }),
  dismiss: () => set({ toast: null }),
}))
