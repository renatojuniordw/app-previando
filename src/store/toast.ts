import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const timeouts = new Map<string, ReturnType<typeof setTimeout>>()

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    const timeout = setTimeout(() => {
      timeouts.delete(id)
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
    timeouts.set(id, timeout)
  },
  removeToast: (id) => {
    const timeout = timeouts.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeouts.delete(id)
    }
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
