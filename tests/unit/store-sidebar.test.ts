import { describe, it, expect, beforeEach } from 'vitest'
import { useSidebarStore } from '@/store/sidebar'

describe('useSidebarStore', () => {
  beforeEach(() => {
    useSidebarStore.setState({ isOpen: false, isDesktopOpen: true })
  })

  it('estado inicial: isOpen false, isDesktopOpen true', () => {
    expect(useSidebarStore.getState().isOpen).toBe(false)
    expect(useSidebarStore.getState().isDesktopOpen).toBe(true)
  })

  it('open() abre sidebar', () => {
    useSidebarStore.getState().open()
    expect(useSidebarStore.getState().isOpen).toBe(true)
  })

  it('close() fecha sidebar', () => {
    useSidebarStore.getState().open()
    useSidebarStore.getState().close()
    expect(useSidebarStore.getState().isOpen).toBe(false)
  })

  it('toggle() inverte estado', () => {
    useSidebarStore.getState().toggle()
    expect(useSidebarStore.getState().isOpen).toBe(true)
    useSidebarStore.getState().toggle()
    expect(useSidebarStore.getState().isOpen).toBe(false)
  })

  it('toggleDesktop() inverte isDesktopOpen', () => {
    useSidebarStore.getState().toggleDesktop()
    expect(useSidebarStore.getState().isDesktopOpen).toBe(false)
    useSidebarStore.getState().toggleDesktop()
    expect(useSidebarStore.getState().isDesktopOpen).toBe(true)
  })

  it('open() não afeta isDesktopOpen', () => {
    useSidebarStore.getState().open()
    expect(useSidebarStore.getState().isDesktopOpen).toBe(true)
  })

  it('close() não afeta isDesktopOpen', () => {
    useSidebarStore.getState().close()
    expect(useSidebarStore.getState().isDesktopOpen).toBe(true)
  })
})
