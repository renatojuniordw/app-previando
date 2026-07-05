import { describe, it, expect } from 'vitest'
import { REVISION_LABELS, REVISION_DESCRIPTIONS } from '@/lib/strategies/revision-types'

describe('REVISION_LABELS', () => {
  it('tem label para REVISAO_VIDA_TODA', () => {
    expect(REVISION_LABELS.REVISAO_VIDA_TODA).toContain('Vida Toda')
    expect(REVISION_LABELS.REVISAO_VIDA_TODA).toContain('STF')
  })

  it('tem label para REVISAO_ART_29', () => {
    expect(REVISION_LABELS.REVISAO_ART_29).toContain('Art. 29')
    expect(REVISION_LABELS.REVISAO_ART_29).toContain('STJ')
  })

  it('tem label para REVISAO_BURACO_NEGRO', () => {
    expect(REVISION_LABELS.REVISAO_BURACO_NEGRO).toContain('Buraco Negro')
    expect(REVISION_LABELS.REVISAO_BURACO_NEGRO).toContain('EC 103')
  })
})

describe('REVISION_DESCRIPTIONS', () => {
  it('descrição Vida Toda menciona 1994', () => {
    expect(REVISION_DESCRIPTIONS.REVISAO_VIDA_TODA).toContain('1994')
  })

  it('descrição Art 29 menciona 20%', () => {
    expect(REVISION_DESCRIPTIONS.REVISAO_ART_29).toContain('20%')
  })

  it('descrição Buraco Negro menciona Reforma', () => {
    expect(REVISION_DESCRIPTIONS.REVISAO_BURACO_NEGRO).toContain('Reforma')
  })

  it('todas as descrições são não vazias', () => {
    for (const [, desc] of Object.entries(REVISION_DESCRIPTIONS)) {
      expect(desc.length).toBeGreaterThan(20)
    }
  })
})
