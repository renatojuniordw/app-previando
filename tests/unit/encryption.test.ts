import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { encrypt, decrypt, decryptOrPlain } from '@/lib/encryption'

const VALID_KEY = 'a'.repeat(64)

describe('encryption', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY
  })

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY
  })

  describe('encrypt', () => {
    it('criptografa texto plano', () => {
      const encrypted = encrypt('hello world')
      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe('hello world')
    })

    it('formato iv:tag:ciphertext', () => {
      const encrypted = encrypt('hello')
      const parts = encrypted.split(':')
      expect(parts.length).toBe(3)
      expect(parts[0].length).toBe(32)
      expect(parts[1].length).toBe(32)
    })

    it('cada criptografia gera output diferente (IV aleatório)', () => {
      const enc1 = encrypt('same text')
      const enc2 = encrypt('same text')
      expect(enc1).not.toBe(enc2)
    })
  })

  describe('decrypt', () => {
    it('descriptografa texto criptografado', () => {
      const encrypted = encrypt('secret message')
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe('secret message')
    })

    it('preserva caracteres especiais', () => {
      const original = 'São Paulo — 2025! @#$%'
      const encrypted = encrypt(original)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(original)
    })

    it('preserva unicode', () => {
      const original = 'café ñ 日本語 🎉'
      const encrypted = encrypt(original)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(original)
    })
  })

  describe('decryptOrPlain', () => {
    it('descriptografa texto criptografado', () => {
      const encrypted = encrypt('secret')
      expect(decryptOrPlain(encrypted)).toBe('secret')
    })

    it('retorna texto plano inalterado', () => {
      expect(decryptOrPlain('just plain text')).toBe('just plain text')
    })

    it('retorna texto quando falha na descriptografia', () => {
      const fakeCiphertext = 'a'.repeat(32) + ':' + 'b'.repeat(32) + ':' + 'c'.repeat(32)
      const result = decryptOrPlain(fakeCiphertext)
      expect(result).toBe(fakeCiphertext)
    })

    it('retorna string vazia inalterada', () => {
      expect(decryptOrPlain('')).toBe('')
    })
  })

  describe('getKey errors', () => {
    it('lança erro quando ENCRYPTION_KEY não está definida', () => {
      delete process.env.ENCRYPTION_KEY
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be exactly 64 hex characters')
    })

    it('lança erro quando ENCRYPTION_KEY é curta', () => {
      process.env.ENCRYPTION_KEY = 'abc'
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be exactly 64 hex characters')
    })
  })
})
