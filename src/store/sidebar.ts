import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  isOpen: boolean
  isDesktopOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  toggleDesktop: () => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      isDesktopOpen: true,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      toggleDesktop: () => set((s) => ({ isDesktopOpen: !s.isDesktopOpen })),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ isDesktopOpen: state.isDesktopOpen }),
    }
  )
)
