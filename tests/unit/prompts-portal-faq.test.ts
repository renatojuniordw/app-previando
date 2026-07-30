import { describe, it, expect } from 'vitest'
import { PORTAL_FAQ_SYSTEM_PROMPT, buildFaqUserPrompt } from '@/lib/prompts/portal/faq'

describe('PORTAL_FAQ_SYSTEM_PROMPT', () => {
  it('is a non-empty string containing FAQ', () => {
    expect(PORTAL_FAQ_SYSTEM_PROMPT).toBeDefined()
    expect(PORTAL_FAQ_SYSTEM_PROMPT.length).toBeGreaterThan(0)
    expect(PORTAL_FAQ_SYSTEM_PROMPT).toContain('FAQ')
    expect(PORTAL_FAQ_SYSTEM_PROMPT).toContain('pergunta')
    expect(PORTAL_FAQ_SYSTEM_PROMPT).toContain('resposta')
  })
})

describe('buildFaqUserPrompt', () => {
  it('includes benefit type when all params provided', () => {
    const result = buildFaqUserPrompt({ benefitType: 'Aposentadoria', eligible: true, rmi: 1500.5, modalityLabel: 'Por Idade', clientAge: 65 })
    expect(result).toContain('Aposentadoria')
    expect(result).toContain('Por Idade')
    expect(result).toContain('65 anos')
    expect(result).toContain('Sim')
    expect(result).toContain('1500.50')
  })

  it('shows "Não informada" when modalityLabel is undefined', () => {
    const result = buildFaqUserPrompt({ benefitType: 'BPC', eligible: false })
    expect(result).toContain('Não informada')
  })

  it('shows "Não informada" when modalityLabel is nullish', () => {
    const result = buildFaqUserPrompt({ benefitType: 'BPC', eligible: false, modalityLabel: undefined })
    expect(result).toContain('Não informada')
  })

  it('shows "Não informada" when clientAge is undefined', () => {
    const result = buildFaqUserPrompt({ benefitType: 'BPC', eligible: false })
    expect(result).toContain('Não informada anos')
  })

  it('shows "Não" when eligible is false', () => {
    const result = buildFaqUserPrompt({ benefitType: 'BPC', eligible: false })
    expect(result).toContain('Não')
    expect(result).not.toContain('Sim')
  })

  it('shows "Sim" when eligible is true', () => {
    const result = buildFaqUserPrompt({ benefitType: 'BPC', eligible: true })
    expect(result).toContain('Sim')
    expect(result).toContain('Elegível: Sim')
  })

  it('shows "A calcular" when rmi is undefined', () => {
    const result = buildFaqUserPrompt({ benefitType: 'BPC', eligible: true })
    expect(result).toContain('A calcular')
  })

  it('shows "A calcular" when rmi is zero (falsy)', () => {
    const result = buildFaqUserPrompt({ benefitType: 'BPC', eligible: true, rmi: 0 })
    expect(result).toContain('A calcular')
  })

  it('formats large rmi correctly with toFixed(2)', () => {
    const result = buildFaqUserPrompt({ benefitType: 'Aposentadoria', eligible: true, rmi: 12345.6 })
    expect(result).toContain('12345.60')
  })
})
