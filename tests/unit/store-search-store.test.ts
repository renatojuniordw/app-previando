import { describe, it, expect, beforeEach } from 'vitest'
import { useSearchStore } from '@/store/search-store'

describe('useSearchStore', () => {
  beforeEach(() => {
    useSearchStore.setState({ open: false })
  })

  it('initial state has open false', () => {
    expect(useSearchStore.getState().open).toBe(false)
  })

  it('openSearch sets open to true', () => {
    useSearchStore.getState().openSearch()
    expect(useSearchStore.getState().open).toBe(true)
  })

  it('close sets open to false', () => {
    useSearchStore.getState().openSearch()
    useSearchStore.getState().close()
    expect(useSearchStore.getState().open).toBe(false)
  })

  it('toggle flips open from false to true', () => {
    useSearchStore.getState().toggle()
    expect(useSearchStore.getState().open).toBe(true)
  })

  it('toggle flips open from true to false', () => {
    useSearchStore.getState().openSearch()
    useSearchStore.getState().toggle()
    expect(useSearchStore.getState().open).toBe(false)
  })

  it('double openSearch keeps open true', () => {
    useSearchStore.getState().openSearch()
    useSearchStore.getState().openSearch()
    expect(useSearchStore.getState().open).toBe(true)
  })

  it('double close keeps open false', () => {
    useSearchStore.getState().close()
    useSearchStore.getState().close()
    expect(useSearchStore.getState().open).toBe(false)
  })
})
