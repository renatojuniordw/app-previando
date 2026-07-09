import { create } from 'zustand'

interface SearchState {
  open: boolean
  openSearch: () => void
  close: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  open: false,
  openSearch: () => set({ open: true }),
  close: () => set({ open: false }),
}))
