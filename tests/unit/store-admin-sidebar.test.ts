import { describe, it, expect, beforeEach } from 'vitest'
import { useAdminSidebarStore } from '@/store/admin-sidebar'

describe('useAdminSidebarStore', () => {
  beforeEach(() => {
    useAdminSidebarStore.setState({ isOpen: false })
  })

  it('initial state has isOpen false', () => {
    expect(useAdminSidebarStore.getState().isOpen).toBe(false)
  })

  it('open sets isOpen to true', () => {
    useAdminSidebarStore.getState().open()
    expect(useAdminSidebarStore.getState().isOpen).toBe(true)
  })

  it('close sets isOpen to false', () => {
    useAdminSidebarStore.getState().open()
    useAdminSidebarStore.getState().close()
    expect(useAdminSidebarStore.getState().isOpen).toBe(false)
  })

  it('toggle flips isOpen from false to true', () => {
    useAdminSidebarStore.getState().toggle()
    expect(useAdminSidebarStore.getState().isOpen).toBe(true)
  })

  it('toggle flips isOpen from true to false', () => {
    useAdminSidebarStore.getState().open()
    useAdminSidebarStore.getState().toggle()
    expect(useAdminSidebarStore.getState().isOpen).toBe(false)
  })

  it('double open keeps isOpen true', () => {
    useAdminSidebarStore.getState().open()
    useAdminSidebarStore.getState().open()
    expect(useAdminSidebarStore.getState().isOpen).toBe(true)
  })

  it('double close keeps isOpen false', () => {
    useAdminSidebarStore.getState().close()
    useAdminSidebarStore.getState().close()
    expect(useAdminSidebarStore.getState().isOpen).toBe(false)
  })
})
