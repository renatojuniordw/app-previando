import { describe, it, expect } from 'vitest'
import { parseCnjNumber, getTribunalId, JUSTICE_SEGMENTS } from '@/lib/cnj-parser'

describe('JUSTICE_SEGMENTS', () => {
  it('tem todos os segmentos esperados', () => {
    expect(JUSTICE_SEGMENTS['1']).toBe('STF')
    expect(JUSTICE_SEGMENTS['2']).toBe('CNJ')
    expect(JUSTICE_SEGMENTS['3']).toBe('STJ')
    expect(JUSTICE_SEGMENTS['4']).toBe('Justiça Federal')
    expect(JUSTICE_SEGMENTS['5']).toBe('Justiça do Trabalho')
    expect(JUSTICE_SEGMENTS['6']).toBe('Justiça Eleitoral')
    expect(JUSTICE_SEGMENTS['7']).toBe('Justiça Militar da União')
    expect(JUSTICE_SEGMENTS['8']).toBe('Justiça Estadual')
    expect(JUSTICE_SEGMENTS['9']).toBe('Justiça Militar Estadual')
  })
})

describe('parseCnjNumber', () => {
  it('retorna null para string com menos de 20 dígitos', () => {
    expect(parseCnjNumber('1234567890123456789')).toBeNull()
  })

  it('retorna null para string com mais de 20 dígitos', () => {
    expect(parseCnjNumber('123456789012345678901')).toBeNull()
  })

  it('retorna null para string vazia', () => {
    expect(parseCnjNumber('')).toBeNull()
  })

  it('parse processo Justiça Estadual (TJSP)', () => {
    const result = parseCnjNumber('1234567-88.2023.8.26.0001')
    expect(result).not.toBeNull()
    expect(result?.justiceCode).toBe('8')
    expect(result?.justiceName).toBe('Justiça Estadual')
    expect(result?.tribunalSigla).toBe('TJSP')
    expect(result?.uf).toBe('SP')
    expect(result?.year).toBe('2023')
  })

  it('parse processo Justiça Federal (TRF3)', () => {
    const result = parseCnjNumber('1234567-88.2023.4.03.0001')
    expect(result).not.toBeNull()
    expect(result?.justiceCode).toBe('4')
    expect(result?.justiceName).toBe('Justiça Federal')
    expect(result?.tribunalSigla).toBe('TRF3')
    expect(result?.uf).toBeNull()
  })

  it('parse processo Justiça do Trabalho (TRT2)', () => {
    const result = parseCnjNumber('1234567-88.2023.5.02.0001')
    expect(result).not.toBeNull()
    expect(result?.justiceCode).toBe('5')
    expect(result?.justiceName).toBe('Justiça do Trabalho')
    expect(result?.tribunalSigla).toBe('TRT2')
  })

  it('parse processo Justiça Eleitoral (TRE-SP)', () => {
    const result = parseCnjNumber('1234567-88.2023.6.26.0001')
    expect(result).not.toBeNull()
    expect(result?.justiceCode).toBe('6')
    expect(result?.tribunalSigla).toBe('TRE-SP')
    expect(result?.uf).toBe('SP')
  })

  it('parse processo Justiça Militar da União (STM)', () => {
    const result = parseCnjNumber('1234567-88.2023.7.00.0001')
    expect(result).not.toBeNull()
    expect(result?.justiceCode).toBe('7')
    expect(result?.tribunalSigla).toBe('STM')
  })

  it('parse processo Justiça Militar Estadual (TJME-SP)', () => {
    const result = parseCnjNumber('1234567-88.2023.9.26.0001')
    expect(result).not.toBeNull()
    expect(result?.justiceCode).toBe('9')
    expect(result?.tribunalSigla).toBe('TJME-SP')
    expect(result?.uf).toBe('SP')
  })

  it('retorna null para Justiça Militar Estadual em estado inválido', () => {
    const result = parseCnjNumber('1234567-88.2023.9.01.0001')
    expect(result).toBeNull()
  })

  it('parse tribunal superior STF', () => {
    const result = parseCnjNumber('1234567-88.2023.1.00.0001')
    expect(result).not.toBeNull()
    expect(result?.justiceCode).toBe('1')
    expect(result?.tribunalSigla).toBe('STF')
  })

  it('formata corretamente o número', () => {
    const result = parseCnjNumber('12345678820238260001')
    expect(result?.formatted).toBe('1234567-88.2023.8.26.0001')
  })

  it('normaliza corretamente', () => {
    const result = parseCnjNumber('1234567-88.2023.8.26.0001')
    expect(result?.normalized).toBe('12345678820238260001')
  })

  it('aceita números com formatação', () => {
    const result = parseCnjNumber('1234567-88.2023.8.26.0001')
    expect(result).not.toBeNull()
  })
})

describe('getTribunalId', () => {
  it('retorna sigla do tribunal', () => {
    expect(getTribunalId('1234567-88.2023.8.26.0001')).toBe('TJSP')
  })

  it('retorna null para número inválido', () => {
    expect(getTribunalId('123')).toBeNull()
  })

  it('retorna sigla TRF', () => {
    expect(getTribunalId('1234567-88.2023.4.03.0001')).toBe('TRF3')
  })

  it('retorna sigla TRT', () => {
    expect(getTribunalId('1234567-88.2023.5.02.0001')).toBe('TRT2')
  })
})
