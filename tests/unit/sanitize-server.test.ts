import { describe, it, expect, beforeEach } from 'vitest'
import { sanitizeInput, hashCPF } from '@/lib/sanitize-server'

describe('sanitizeInput', () => {
  it('deve remover tags HTML e conteudo', () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello')
  })

  it('deve remover atributos HTML', () => {
    expect(sanitizeInput('<a href="http://evil.com">link</a>')).toBe('link')
  })

  it('deve truncar para 10000 caracteres', () => {
    const long = 'a'.repeat(15000)
    expect(sanitizeInput(long).length).toBe(10000)
  })

  it('deve trimar espacos', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('deve retornar texto limpo para entrada sem HTML', () => {
    expect(sanitizeInput('texto normal')).toBe('texto normal')
  })
})

describe('hashCPF', () => {
  const originalEnv = process.env.CPF_HASH_SALT

  beforeEach(() => {
    process.env.CPF_HASH_SALT = 'test-salt-123'
  })

  afterAll(() => {
    process.env.CPF_HASH_SALT = originalEnv
  })

  it('deve retornar hash hex de 64 caracteres', () => {
    const hash = hashCPF('12345678901')
    expect(hash.length).toBe(64)
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
  })

  it('deve retornar mesmo hash para mesmo CPF', () => {
    const h1 = hashCPF('12345678901')
    const h2 = hashCPF('12345678901')
    expect(h1).toBe(h2)
  })

  it('deve retornar hashes diferentes para CPFs diferentes', () => {
    const h1 = hashCPF('12345678901')
    const h2 = hashCPF('11144477735')
    expect(h1).not.toBe(h2)
  })

  it('deve aceitar CPF com formatacao', () => {
    const h1 = hashCPF('123.456.789-01')
    const h2 = hashCPF('12345678901')
    expect(h1).toBe(h2)
  })

  it('deve lancar erro para CPF invalido', () => {
    expect(() => hashCPF('123')).toThrow('CPF inválido')
  })
})
