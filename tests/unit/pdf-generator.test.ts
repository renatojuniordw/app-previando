import { describe, it, expect } from 'vitest'
import { generateBpcPDF, generateCasePDF, generateBpcConsolidatedPDF } from '@/lib/pdf-generator'
import type { CasePDFData, BpcConsolidatedPDFData } from '@/lib/pdf-generator'

describe('generateBpcPDF', () => {
  it('generates PDF with minimum data', async () => {
    const buffer = await generateBpcPDF({ result: 'Resultado da análise BPC/LOAS', type: 'BPC' })
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('generates PDF with all optional fields', async () => {
    const buffer = await generateBpcPDF({
      result: 'Análise completa',
      type: 'LOAS',
      clientInfo: {
        name: 'João Silva',
        birthDate: '01/01/1980',
        phone: '(11) 99999-9999',
        email: 'joao@email.com',
        maritalStatus: 'Casado',
        profession: 'Advogado',
        address: 'Rua A, 123',
      },
      generatedAt: '10/06/2024',
      clientName: 'João Silva',
      userName: 'Dr. Pedro',
    })
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('generates PDF with markdown in result', async () => {
    const buffer = await generateBpcPDF({
      result: '# Análise\n\n**Conclusão:** favorável\n\n- Item 1\n- Item 2\n\n---\n\n_Nota:_ teste',
      type: 'BPC/LOAS',
    })
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })
})

describe('generateBpcConsolidatedPDF', () => {
  it('generates PDF with sections', async () => {
    const data: BpcConsolidatedPDFData = {
      sections: [
        { label: 'Análise', content: '# Resultado\n\nConteúdo da análise.' },
        { label: 'Conclusão', content: '**Favorável** com ressalvas.' },
      ],
    }
    const buffer = await generateBpcConsolidatedPDF(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('generates PDF with client info and generatedAt', async () => {
    const data: BpcConsolidatedPDFData = {
      sections: [{ label: 'Teste', content: 'Conteúdo' }],
      clientInfo: { name: 'Maria', birthDate: '15/05/1990' },
      generatedAt: '10/06/2024',
      userName: 'Dr. Silva',
    }
    const buffer = await generateBpcConsolidatedPDF(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('generates PDF with multiple sections and markdown', async () => {
    const data: BpcConsolidatedPDFData = {
      sections: [
        { label: 'Seção 1', content: 'Texto simples' },
        { label: 'Seção 2', content: '# Heading\n\n- item\n\n---\n\n**bold**' },
      ],
      userName: 'Dr. Teste',
    }
    const buffer = await generateBpcConsolidatedPDF(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })
})

describe('generateCasePDF', () => {
  it('generates PDF with minimum client data', async () => {
    const data: CasePDFData = {
      clientName: 'Carlos Souza',
      clientCpf: '11144477735',
      clientBirthDate: '10/05/1985',
      clientMaritalStatus: 'Solteiro',
    }
    const buffer = await generateCasePDF(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('generates PDF with all optional fields', async () => {
    const data: CasePDFData = {
      clientName: 'Ana Maria',
      clientCpf: '11144477735',
      clientBirthDate: '20/03/1978',
      clientDeathDate: '15/01/2024',
      clientMaritalStatus: 'Viúvo',
      clientProfession: 'Professora',
      clientPhone: '(21) 99999-8888',
      clientEmail: 'ana@email.com',
      clientAddress: 'Rua B, 456',
      cnisSummary: 'Total de 180 contribuições',
      caseStatus: 'Em análise',
      createdAt: '01/06/2024',
    }
    const buffer = await generateCasePDF(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('generates PDF with selected calculation', async () => {
    const data: CasePDFData = {
      clientName: 'Teste',
      clientCpf: '11144477735',
      clientBirthDate: '01/01/1990',
      clientMaritalStatus: 'Casado',
      selectedCalculation: {
        type: 'Aposentadoria por Idade',
        value: 'R$ 2.500,00',
        details: { 'Fator Previdenciário': '0.85', 'Tempo de Contribuição': '35 anos' },
        formulaSummary: 'MI * FP = RMI',
        averageSalary: 'R$ 2.941,18',
        coefficient: '0.85',
      },
      opinion: '# Parecer Jurídico\n\n**Conclusão:** favorável ao pedido.',
      lawyerName: 'Dr. João Advogado',
    }
    const buffer = await generateCasePDF(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('applies watermark when enabled', async () => {
    const data: CasePDFData = {
      clientName: 'Teste',
      clientCpf: '11144477735',
      clientBirthDate: '01/01/1990',
      clientMaritalStatus: 'Solteiro',
      watermark: true,
    }
    const buffer = await generateCasePDF(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('generates PDF without opinion and without calculation', async () => {
    const data: CasePDFData = {
      clientName: 'Sem Parecer',
      clientCpf: '11144477735',
      clientBirthDate: '05/05/1980',
      clientMaritalStatus: 'Divorciado',
    }
    const buffer = await generateCasePDF(data)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })
})
