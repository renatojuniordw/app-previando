import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useRecentStore } from '@/store/recent-store'

const STORAGE_KEY = 'sidebar-recents'

let storage: Record<string, string> = {}

beforeEach(() => {
  storage = {}
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value },
    removeItem: (key: string) => { delete storage[key] },
    clear: () => { storage = {} },
    get length() { return Object.keys(storage).length },
    key: (index: number) => Object.keys(storage)[index] ?? null,
  })
  useRecentStore.setState({ items: [] })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useRecentStore', () => {
  it('initial state is empty array', () => {
    expect(useRecentStore.getState().items).toEqual([])
  })

  it('add prepends item with visitedAt timestamp', () => {
    useRecentStore.getState().add({ type: 'client', id: '1', label: 'João', href: '/clients/1' })
    const items = useRecentStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].type).toBe('client')
    expect(items[0].id).toBe('1')
    expect(items[0].label).toBe('João')
    expect(items[0].href).toBe('/clients/1')
    expect(items[0].visitedAt).toBeDefined()
    expect(typeof items[0].visitedAt).toBe('string')
  })

  it('add keeps max 5 items dropping oldest', () => {
    for (let i = 1; i <= 6; i++) {
      useRecentStore.getState().add({ type: 'case', id: `${i}`, label: `Case ${i}`, href: `/cases/${i}` })
    }
    const items = useRecentStore.getState().items
    expect(items).toHaveLength(5)
    expect(items[0].id).toBe('6')
    expect(items[4].id).toBe('2')
  })

  it('add deduplicates by id keeping newest position', () => {
    useRecentStore.getState().add({ type: 'client', id: 'a', label: 'First', href: '/clients/a' })
    useRecentStore.getState().add({ type: 'case', id: 'b', label: 'Second', href: '/cases/b' })
    useRecentStore.getState().add({ type: 'client', id: 'a', label: 'First Updated', href: '/clients/a' })
    const items = useRecentStore.getState().items
    expect(items).toHaveLength(2)
    expect(items[0].id).toBe('a')
    expect(items[0].label).toBe('First Updated')
  })

  it('add persists to localStorage', () => {
    useRecentStore.getState().add({ type: 'client', id: '1', label: 'Maria', href: '/clients/1' })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].label).toBe('Maria')
  })

  it('persists and reads back from localStorage', () => {
    useRecentStore.getState().add({ type: 'client', id: 'p1', label: 'Persisted', href: '/clients/p1' })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].label).toBe('Persisted')
    expect(stored[0].id).toBe('p1')
  })

  it('clear empties items and localStorage', () => {
    useRecentStore.getState().add({ type: 'client', id: '1', label: 'Test', href: '/clients/1' })
    useRecentStore.getState().clear()
    expect(useRecentStore.getState().items).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('add after clear works correctly', () => {
    useRecentStore.getState().add({ type: 'client', id: '1', label: 'Before', href: '/clients/1' })
    useRecentStore.getState().clear()
    useRecentStore.getState().add({ type: 'case', id: '2', label: 'After', href: '/cases/2' })
    expect(useRecentStore.getState().items).toHaveLength(1)
    expect(useRecentStore.getState().items[0].label).toBe('After')
  })

  it('newest item is always first in array', () => {
    useRecentStore.getState().add({ type: 'client', id: 'a', label: 'A', href: '/a' })
    useRecentStore.getState().add({ type: 'client', id: 'b', label: 'B', href: '/b' })
    useRecentStore.getState().add({ type: 'client', id: 'c', label: 'C', href: '/c' })
    const items = useRecentStore.getState().items
    expect(items[0].label).toBe('C')
    expect(items[1].label).toBe('B')
    expect(items[2].label).toBe('A')
  })
})
