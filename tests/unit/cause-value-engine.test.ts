import { describe, it, expect } from 'vitest'
import { calculateCauseValue } from '@/lib/cause-value-engine'

const INDICES_INPC: Record<string, number> = {
  '2023-01': 0.005,
  '2023-02': 0.003,
  '2023-03': 0.004,
  '2023-04': 0.002,
  '2023-05': 0.003,
  '2023-06': 0.005,
  '2023-07': 0.004,
  '2023-08': 0.003,
  '2023-09': 0.002,
  '2023-10': 0.004,
  '2023-11': 0.003,
  '2023-12': 0.005,
}

describe('calculateCauseValue', () => {
  it('deve calcular valor da causa com 12 vincendas', () => {
    const result = calculateCauseValue({
      dataRequerimentoAdministrativo: '2023-01-10',
      dataAjuizamento: '2023-06-15',
      dataInicioDireito: '2023-01-01',
      valorSalarioMinimoVigente: 1412,
      indicesINPC: INDICES_INPC,
    })

    expect(result.dataRequerimentoAdministrativo).toBe('2023-01-10')
    expect(result.dataAjuizamento).toBe('2023-06-15')
    expect(result.dataInicioDireito).toBe('2023-01-01')
    expect(result.numeroParcelasVincendas).toBe(12)
    expect(result.valorParcelaVincenda).toBe(1412)
    expect(result.valorTotalVincendas).toBe(12 * 1412)
    expect(result.valorDaCausa).toBeGreaterThan(result.valorTotalCorrigido)
    expect(result.memoriaCalculo.salarioMinimoUtilizado).toBe(1412)
  })

  it('deve calcular com numero de vincendas customizado', () => {
    const result = calculateCauseValue({
      dataRequerimentoAdministrativo: '2023-01-10',
      dataAjuizamento: '2023-06-15',
      dataInicioDireito: '2023-01-01',
      valorSalarioMinimoVigente: 1412,
      indicesINPC: INDICES_INPC,
      numeroParcelasVincendas: 6,
    })

    expect(result.numeroParcelasVincendas).toBe(6)
    expect(result.valorTotalVincendas).toBe(6 * 1412)
  })

  it('deve lancar erro quando requerimento e posterior ao ajuizamento', () => {
    expect(() =>
      calculateCauseValue({
        dataRequerimentoAdministrativo: '2023-12-01',
        dataAjuizamento: '2023-06-15',
        dataInicioDireito: '2023-01-01',
        valorSalarioMinimoVigente: 1412,
        indicesINPC: INDICES_INPC,
      })
    ).toThrow('A data do requerimento administrativo não pode ser posterior')
  })

  it('deve lancar erro quando DIB e posterior ao ajuizamento', () => {
    expect(() =>
      calculateCauseValue({
        dataRequerimentoAdministrativo: '2023-01-10',
        dataAjuizamento: '2023-06-15',
        dataInicioDireito: '2024-01-01',
        valorSalarioMinimoVigente: 1412,
        indicesINPC: INDICES_INPC,
      })
    ).toThrow('A data de início do direito não pode ser posterior')
  })

  it('deve incluir memoria de calculo com retroativo', () => {
    const result = calculateCauseValue({
      dataRequerimentoAdministrativo: '2023-01-10',
      dataAjuizamento: '2023-06-15',
      dataInicioDireito: '2023-01-01',
      valorSalarioMinimoVigente: 1412,
      indicesINPC: INDICES_INPC,
    })

    expect(result.memoriaCalculo.retroativo).toBeDefined()
    expect(result.memoriaCalculo.retroativo.parcelas).toBeDefined()
    expect(Array.isArray(result.memoriaCalculo.retroativo.parcelas)).toBe(true)
    expect(result.memoriaCalculo.retroativo.acumuladoINPC).toBeDefined()
  })

  it('deve retornar mesesAtraso correto', () => {
    const result = calculateCauseValue({
      dataRequerimentoAdministrativo: '2023-01-10',
      dataAjuizamento: '2023-06-15',
      dataInicioDireito: '2023-01-01',
      valorSalarioMinimoVigente: 1412,
      indicesINPC: INDICES_INPC,
    })

    expect(result.mesesAtraso).toBeGreaterThanOrEqual(5)
  })

  it('deve usar fallback INPC quando indice nao esta no banco', () => {
    const result = calculateCauseValue({
      dataRequerimentoAdministrativo: '2023-01-10',
      dataAjuizamento: '2023-06-15',
      dataInicioDireito: '2023-01-01',
      valorSalarioMinimoVigente: 1412,
      indicesINPC: {},
    })

    expect(result.valorTotalCorrigido).toBeGreaterThan(0)
    expect(result.valorDaCausa).toBeGreaterThan(0)
  })
})
