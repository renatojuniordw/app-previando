import { describe, it, expect, beforeEach } from 'vitest'
import { useUpgradeModal } from '@/store/upgrade-modal'

describe('useUpgradeModal', () => {
  beforeEach(() => {
    useUpgradeModal.setState({ open: false, message: '', feature: '', upgradeRequired: 'SOLO' })
  })

  it('estado inicial: open false', () => {
    expect(useUpgradeModal.getState().open).toBe(false)
    expect(useUpgradeModal.getState().message).toBe('')
    expect(useUpgradeModal.getState().feature).toBe('')
    expect(useUpgradeModal.getState().upgradeRequired).toBe('SOLO')
  })

  it('openModal abre e seta params', () => {
    useUpgradeModal.getState().openModal({
      message: 'Faça upgrade',
      feature: 'simulador',
      upgradeRequired: 'PRO',
    })
    const state = useUpgradeModal.getState()
    expect(state.open).toBe(true)
    expect(state.message).toBe('Faça upgrade')
    expect(state.feature).toBe('simulador')
    expect(state.upgradeRequired).toBe('PRO')
  })

  it('closeModal fecha modal', () => {
    useUpgradeModal.getState().openModal({
      message: 'Teste',
      feature: 'test',
      upgradeRequired: 'SOLO',
    })
    useUpgradeModal.getState().closeModal()
    expect(useUpgradeModal.getState().open).toBe(false)
  })

  it('closeModal não limpa message e feature', () => {
    useUpgradeModal.getState().openModal({
      message: 'Teste',
      feature: 'test',
      upgradeRequired: 'SOLO',
    })
    useUpgradeModal.getState().closeModal()
    expect(useUpgradeModal.getState().message).toBe('Teste')
    expect(useUpgradeModal.getState().feature).toBe('test')
  })

  it('openModal sobrescreve estado anterior', () => {
    useUpgradeModal.getState().openModal({
      message: 'Primeiro',
      feature: 'feat1',
      upgradeRequired: 'SOLO',
    })
    useUpgradeModal.getState().openModal({
      message: 'Segundo',
      feature: 'feat2',
      upgradeRequired: 'PRO',
    })
    const state = useUpgradeModal.getState()
    expect(state.message).toBe('Segundo')
    expect(state.feature).toBe('feat2')
    expect(state.upgradeRequired).toBe('PRO')
  })
})
