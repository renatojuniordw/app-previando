import { describe, it, expect } from 'vitest'
import { generateBpcPDF } from '@/lib/pdf-generator'

describe('generateBpcPDF', () => {
  it('deve gerar PDF com dados minimos', async () => {
    const buffer = await generateBpcPDF({
      result: 'Resultado da análise BPC/LOAS',
      type: 'BPC',
    })
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('deve gerar PDF com dados do cliente', async () => {
    const buffer = await generateBpcPDF({
      result: 'Análise completa',
      type: 'LOAS',
      clientInfo: {
        name: 'João Silva',
        birthDate: '01/01/1980',
        phone: '(11) 99999-9999',
      },
      generatedAt: '10/06/2024',
    })
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('deve gerar PDF com markdown no resultado', async () => {
    const buffer = await generateBpcPDF({
      result: '# Análise\n\n**Conclusão:** favorável\n\n- Item 1\n- Item 2',
      type: 'BPC/LOAS',
    })
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })
})
