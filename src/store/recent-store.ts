import { create } from 'zustand'

interface RecentItem {
  type: 'client' | 'case'
  id: string
  label: string
  href: string
  visitedAt: string
}

interface RecentStore {
  items: RecentItem[]
  add: (item: Omit<RecentItem, 'visitedAt'>) => void
  clear: () => void
}

const MAX_ITEMS = 5
const STORAGE_KEY = 'sidebar-recents'

function load(): RecentItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch { return [] }
}

function save(items: RecentItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const useRecentStore = create<RecentStore>((set) => ({
  items: load(),
  add: (item) => set((state) => {
    const filtered = state.items.filter(i => i.id !== item.id)
    const next = [{ ...item, visitedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS)
    save(next)
    return { items: next }
  }),
  clear: () => { save([]); set({ items: [] }) },
}))
