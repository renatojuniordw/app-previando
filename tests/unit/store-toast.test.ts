import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from '@/store/toast'

describe('useToast', () => {
  beforeEach(() => {
    useToast.setState({ toasts: [] })
  })

  it('estado inicial: toasts vazio', () => {
    expect(useToast.getState().toasts).toEqual([])
  })

  it('addToast adiciona toast com id', () => {
    useToast.getState().addToast({ type: 'success', title: 'Teste' })
    const toasts = useToast.getState().toasts
    expect(toasts.length).toBe(1)
    expect(toasts[0].id).toBeDefined()
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].title).toBe('Teste')
  })

  it('addToast com message', () => {
    useToast.getState().addToast({ type: 'error', title: 'Erro', message: 'Falha na operação' })
    const toasts = useToast.getState().toasts
    expect(toasts[0].message).toBe('Falha na operação')
  })

  it('addToast múltiplos toasts', () => {
    useToast.getState().addToast({ type: 'success', title: 'A' })
    useToast.getState().addToast({ type: 'error', title: 'B' })
    expect(useToast.getState().toasts.length).toBe(2)
  })

  it('removeToast remove toast por id', () => {
    useToast.getState().addToast({ type: 'success', title: 'A' })
    const id = useToast.getState().toasts[0].id
    useToast.getState().removeToast(id)
    expect(useToast.getState().toasts.length).toBe(0)
  })

  it('removeToast com id inexistente não quebra', () => {
    useToast.getState().removeToast('id-inexistente')
    expect(useToast.getState().toasts.length).toBe(0)
  })

  it('addToast cria timeout de 4s', () => {
    vi.useFakeTimers()
    useToast.getState().addToast({ type: 'info', title: 'Teste' })
    expect(useToast.getState().toasts.length).toBe(1)
    vi.advanceTimersByTime(4000)
    expect(useToast.getState().toasts.length).toBe(0)
    vi.useRealTimers()
  })

  it('removeToast cancela timeout', () => {
    vi.useFakeTimers()
    useToast.getState().addToast({ type: 'info', title: 'Teste' })
    const id = useToast.getState().toasts[0].id
    useToast.getState().removeToast(id)
    vi.advanceTimersByTime(4000)
    expect(useToast.getState().toasts.length).toBe(0)
    vi.useRealTimers()
  })

  it('types: success, error, info', () => {
    useToast.getState().addToast({ type: 'success', title: 'A' })
    useToast.getState().addToast({ type: 'error', title: 'B' })
    useToast.getState().addToast({ type: 'info', title: 'C' })
    const types = useToast.getState().toasts.map(t => t.type)
    expect(types).toContain('success')
    expect(types).toContain('error')
    expect(types).toContain('info')
  })
})
