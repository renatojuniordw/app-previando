import { describe, it, expect } from 'vitest'
import { isValidCPF } from '@/lib/cpf'

describe('isValidCPF', () => {
  it('aceita CPFs válidos conhecidos', () => {
    expect(isValidCPF('111.444.777-35')).toBe(true)
    expect(isValidCPF('11144477735')).toBe(true)
  })

  it('rejeita CPFs com dígito verificador incorreto', () => {
    expect(isValidCPF('11144477736')).toBe(false)
  })

  it('rejeita sequências repetidas', () => {
    expect(isValidCPF('00000000000')).toBe(false)
    expect(isValidCPF('11111111111')).toBe(false)
  })

  it('rejeita tamanho incorreto', () => {
    expect(isValidCPF('123')).toBe(false)
    expect(isValidCPF('123456789012')).toBe(false)
  })
})
