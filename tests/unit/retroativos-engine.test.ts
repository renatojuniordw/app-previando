import { describe, it, expect } from 'vitest'
import { calculateRetroativos } from '@/lib/retroativos-engine'

describe('calculateRetroativos', () => {
  const mockINPC: Record<string, number> = {
    '2023-01': 0.0057,
    '2023-02': 0.0052,
    '2023-03': 0.0061,
    '2023-04': 0.0055,
    '2023-05': 0.0048,
    '2023-06': 0.0039,
    '2023-07': 0.0044,
    '2023-08': 0.0038,
    '2023-09': 0.0053,
    '2023-10': 0.0047,
    '2023-11': 0.0051,
    '2023-12': 0.0059,
  }

  it('deve calcular retroativos corretamente', () => {
    const result = calculateRetroativos({
      dataInicioDireito: '2023-01-01',
      dataRequerimento: '2023-06-30',
      valorMensalBruto: 2000.00,
      indicesINPC: mockINPC,
    })

    expect(result.mesesAtraso).toBe(7)
    expect(result.valorMensalBruto).toBe(2000.00)
    expect(result.valorTotalBruto).toBe(14000.00)
    expect(result.valorTotalCorrigido).toBeGreaterThan(result.valorTotalBruto)
    expect(result.memoriaCalculo.parcelas.length).toBe(7)
    expect(result.memoriaCalculo.acumuladoINPC).toBeGreaterThan(0)
    expect(result.valorLiquidoFinal).toBe(result.valorTotalCorrigido)
  })

  it('deve aplicar descontos corretamente', () => {
    const result = calculateRetroativos({
      dataInicioDireito: '2023-01-01',
      dataRequerimento: '2023-03-31',
      valorMensalBruto: 3000.00,
      valorDescontos: 500.00,
      descricaoDescontos: 'Honorários advocatícios',
      indicesINPC: mockINPC,
    })

    expect(result.valorDescontos).toBe(500)
    expect(result.descricaoDescontos).toBe('Honorários advocatícios')
    expect(result.valorLiquidoFinal).toBe(result.valorTotalCorrigido - 500)
    expect(result.mesesAtraso).toBe(4)
  })

  it('deve lançar erro quando dataInicioDireito > dataRequerimento', () => {
    expect(() => calculateRetroativos({
      dataInicioDireito: '2024-01-01',
      dataRequerimento: '2023-01-01',
      valorMensalBruto: 1000.00,
      indicesINPC: {},
    })).toThrow('data de início do direito não pode ser posterior')
  })

  it('deve retornar 1 mês quando mesma competência', () => {
    const result = calculateRetroativos({
      dataInicioDireito: '2023-06-01',
      dataRequerimento: '2023-06-30',
      valorMensalBruto: 1500.00,
      indicesINPC: mockINPC,
    })

    expect(result.mesesAtraso).toBe(2)
    expect(result.memoriaCalculo.parcelas.length).toBe(2)
  })

  it('deve usar fallback INPC quando índice não encontrado', () => {
    const result = calculateRetroativos({
      dataInicioDireito: '2023-01-01',
      dataRequerimento: '2023-01-31',
      valorMensalBruto: 1000.00,
      indicesINPC: {}, // Sem índices — usa fallback
    })

    expect(result.mesesAtraso).toBe(2)
    expect(result.valorTotalCorrigido).toBeGreaterThan(0)
  })

  it('deve calcular percentual de honorários e valor líquido do cliente', () => {
    const result = calculateRetroativos({
      dataInicioDireito: '2023-01-01',
      dataRequerimento: '2023-03-31',
      valorMensalBruto: 3000.00,
      percentualHonorarios: 20,
      indicesINPC: mockINPC,
    })

    expect(result.percentualHonorarios).toBe(20)
    expect(result.valorHonorarios).toBe(Number((result.valorLiquidoFinal * 0.2).toFixed(2)))
    expect(result.valorLiquidoCliente).toBe(Number((result.valorLiquidoFinal - (result.valorHonorarios ?? 0)).toFixed(2)))
  })

  it('deve lançar erro quando percentual de honorários está fora do intervalo 0-100', () => {
    expect(() => calculateRetroativos({
      dataInicioDireito: '2023-01-01',
      dataRequerimento: '2023-03-31',
      valorMensalBruto: 3000.00,
      percentualHonorarios: 150,
      indicesINPC: mockINPC,
    })).toThrow('percentual de honorários deve estar entre 0 e 100')
  })

  it('deve lidar com período longo de retroativos', () => {
    const result = calculateRetroativos({
      dataInicioDireito: '2022-01-01',
      dataRequerimento: '2024-12-31',
      valorMensalBruto: 2500.00,
      indicesINPC: mockINPC,
    })

    expect(result.mesesAtraso).toBe(37)
    expect(result.memoriaCalculo.parcelas.length).toBe(37)
    expect(result.valorTotalCorrigido).toBeGreaterThan(result.valorTotalBruto)
  })
})
