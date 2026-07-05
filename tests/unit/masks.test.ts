import { describe, it, expect } from 'vitest'
import { stripNonDigits, formatCPF, formatPhone, formatCurrencyDisplay, parseCurrency } from '@/lib/masks'

describe('stripNonDigits', () => {
  it('remove caracteres não numéricos', () => {
    expect(stripNonDigits('111.444.777-35')).toBe('11144477735')
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(stripNonDigits('')).toBe('')
  })

  it('retorna dígitos inalterados', () => {
    expect(stripNonDigits('12345678901')).toBe('12345678901')
  })

  it('remove letras e símbolos', () => {
    expect(stripNonDigits('abc123!@#')).toBe('123')
  })
})

describe('formatCPF', () => {
  it('formata 11 dígitos corretamente', () => {
    expect(formatCPF('11144477735')).toBe('111.444.777-35')
  })

  it('remove formatação existente antes de formatar', () => {
    expect(formatCPF('111.444.777-35')).toBe('111.444.777-35')
  })

  it('formata parcialmente com menos de 11 dígitos', () => {
    expect(formatCPF('111')).toBe('111')
    expect(formatCPF('111444')).toBe('111.444')
    expect(formatCPF('111444777')).toBe('111.444.777')
  })

  it('trunca para 11 dígitos', () => {
    expect(formatCPF('11144477735999')).toBe('111.444.777-35')
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(formatCPF('')).toBe('')
  })
})

describe('formatPhone', () => {
  it('formata 10 dígitos (fixo)', () => {
    expect(formatPhone('1198765432')).toBe('(11) 9876-5432')
  })

  it('formata 11 dígitos (celular)', () => {
    expect(formatPhone('11998765432')).toBe('(11) 99876-5432')
  })

  it('formata parcialmente com menos dígitos', () => {
    expect(formatPhone('11')).toBe('11')
    expect(formatPhone('119')).toBe('(11) 9')
  })

  it('trunca para 11 dígitos', () => {
    expect(formatPhone('11998765432999')).toBe('(11) 99876-5432')
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(formatPhone('')).toBe('')
  })

  it('remove formatação existente', () => {
    expect(formatPhone('(11) 99876-5432')).toBe('(11) 99876-5432')
  })
})

describe('formatCurrencyDisplay', () => {
  it('formata centavos para valor em reais', () => {
    expect(formatCurrencyDisplay('123456')).toBe('1.234,56')
  })

  it('formata valor unitário', () => {
    expect(formatCurrencyDisplay('99')).toBe('0,99')
  })

  it('formata 100 centésimos = 1,00', () => {
    expect(formatCurrencyDisplay('100')).toBe('1,00')
  })

  it('formata valor grande', () => {
    expect(formatCurrencyDisplay('1000000000')).toBe('10.000.000,00')
  })

  it('retorna vazio para zero', () => {
    expect(formatCurrencyDisplay('0')).toBe('')
  })

  it('retorna vazio para string vazia', () => {
    expect(formatCurrencyDisplay('')).toBe('')
  })

  it('padded para 1 dígito', () => {
    expect(formatCurrencyDisplay('5')).toBe('0,05')
  })

  it('ignora caracteres não numéricos', () => {
    expect(formatCurrencyDisplay('R$ 1.234,56')).toBe('1.234,56')
  })
})

describe('parseCurrency', () => {
  it('converte string formatada para número', () => {
    expect(parseCurrency('1.234,56')).toBe(1234.56)
  })

  it('converte sem centavos', () => {
    expect(parseCurrency('1000,00')).toBe(1000)
  })

  it('converte sem separador de milhares', () => {
    expect(parseCurrency('500,75')).toBe(500.75)
  })

  it('retorna 0 para string vazia', () => {
    expect(parseCurrency('')).toBe(0)
  })

  it('converte valor inteiro', () => {
    expect(parseCurrency('100')).toBe(100)
  })
})
