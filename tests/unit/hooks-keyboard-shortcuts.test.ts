import { describe, it, expect } from 'vitest'
import { SHORTCUTS_LIST } from '@/hooks/useKeyboardShortcuts'

describe('SHORTCUTS_LIST', () => {
  it('tem todos os atalhos documentados', () => {
    expect(SHORTCUTS_LIST.length).toBeGreaterThan(5)
  })

  it('cada atalho tem keys e description', () => {
    for (const s of SHORTCUTS_LIST) {
      expect(s.keys).toBeDefined()
      expect(s.description.length).toBeGreaterThan(0)
    }
  })

  it('inclui atalho de ajuda', () => {
    const help = SHORTCUTS_LIST.find(s => s.keys === '?')
    expect(help).toBeDefined()
  })

  it('inclui atalho de Escape', () => {
    const esc = SHORTCUTS_LIST.find(s => s.keys === 'Esc')
    expect(esc).toBeDefined()
  })

  it('inclui navegação g+d', () => {
    const gd = SHORTCUTS_LIST.find(s => s.keys === 'g + d')
    expect(gd).toBeDefined()
    expect(gd?.description).toContain('Dashboard')
  })

  it('inclui navegação g+c', () => {
    const gc = SHORTCUTS_LIST.find(s => s.keys === 'g + c')
    expect(gc).toBeDefined()
    expect(gc?.description).toContain('Clientes')
  })
})
