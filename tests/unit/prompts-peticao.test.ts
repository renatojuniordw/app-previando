import { describe, it, expect } from 'vitest'
import { PETICAO_INICIAL_SYSTEM_PROMPT } from '@/lib/prompts/peticao-inicial'

describe('PETICAO_INICIAL_SYSTEM_PROMPT', () => {
  it('é string não vazia', () => {
    expect(PETICAO_INICIAL_SYSTEM_PROMPT.length).toBeGreaterThan(100)
  })

  it('contém aviso de segurança', () => {
    expect(PETICAO_INICIAL_SYSTEM_PROMPT).toContain('SEGURANÇA')
  })

  it('contém regras absolutas', () => {
    expect(PETICAO_INICIAL_SYSTEM_PROMPT).toContain('REGRAS ABSOLUTAS')
  })

  it('contém estrutura da petição', () => {
    expect(PETICAO_INICIAL_SYSTEM_PROMPT).toContain('Endereçamento')
    expect(PETICAO_INICIAL_SYSTEM_PROMPT).toContain('Qualificação')
    expect(PETICAO_INICIAL_SYSTEM_PROMPT).toContain('Dos Fatos')
    expect(PETICAO_INICIAL_SYSTEM_PROMPT).toContain('Do Direito')
    expect(PETICAO_INICIAL_SYSTEM_PROMPT).toContain('Dos Pedidos')
    expect(PETICAO_INICIAL_SYSTEM_PROMPT).toContain('Das Provas')
  })

  it('contém rodapé obrigatório', () => {
    expect(PETICAO_INICIAL_SYSTEM_PROMPT).toContain('previando.com.br')
  })

  it('contém regra de não inventar dados', () => {
    expect(PETICAO_INICIAL_SYSTEM_PROMPT).toContain('invent')
  })
})
