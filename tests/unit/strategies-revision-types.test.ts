import { describe, it, expect } from 'vitest'
import { REVISION_LABELS, REVISION_DESCRIPTIONS } from '@/lib/strategies/revision-types'

describe('REVISION_LABELS', () => {
  it('tem label para REVISAO_BENEFICIO', () => {
    expect(REVISION_LABELS.REVISAO_BENEFICIO).toBe('Revisão de Benefício')
  })
})

describe('REVISION_DESCRIPTIONS', () => {
  it('descrição é não vazia e menciona CNIS', () => {
    expect(REVISION_DESCRIPTIONS.REVISAO_BENEFICIO.length).toBeGreaterThan(20)
    expect(REVISION_DESCRIPTIONS.REVISAO_BENEFICIO).toContain('CNIS')
  })
})
