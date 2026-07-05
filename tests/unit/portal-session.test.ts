import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPortalSessionValue, isPortalSessionValid, PORTAL_SESSION_COOKIE } from '@/lib/portal-session'

const TEST_SECRET = 'test-secret-key-for-hmac-signing'

describe('portal-session', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = TEST_SECRET
  })

  afterEach(() => {
    delete process.env.NEXTAUTH_SECRET
  })

  describe('PORTAL_SESSION_COOKIE', () => {
    it('é portal_verified', () => {
      expect(PORTAL_SESSION_COOKIE).toBe('portal_verified')
    })
  })

  describe('createPortalSessionValue', () => {
    it('cria valor com payload e assinatura', () => {
      const { value, maxAge } = createPortalSessionValue('token123')
      const parts = value.split('.')
      expect(parts.length).toBe(3)
      expect(parts[0]).toBe('token123')
      expect(maxAge).toBe(7200)
    })

    it('payload contém timestamp de expiração', () => {
      const { value } = createPortalSessionValue('tok')
      const exp = Number(value.split('.')[1])
      expect(exp).toBeGreaterThan(Date.now())
      expect(exp).toBeLessThanOrEqual(Date.now() + 7200000)
    })

    it('maxAge é 2 horas em segundos', () => {
      const { maxAge } = createPortalSessionValue('tok')
      expect(maxAge).toBe(60 * 60 * 2)
    })
  })

  describe('isPortalSessionValid', () => {
    it('retorna true para sessão válida', () => {
      const { value } = createPortalSessionValue('mytoken')
      expect(isPortalSessionValid(value, 'mytoken')).toBe(true)
    })

    it('retorna false para token diferente', () => {
      const { value } = createPortalSessionValue('mytoken')
      expect(isPortalSessionValid(value, 'wrongtoken')).toBe(false)
    })

    it('retorna false para cookie undefined', () => {
      expect(isPortalSessionValid(undefined, 'tok')).toBe(false)
    })

    it('retorna false para cookie null', () => {
      expect(isPortalSessionValid(null, 'tok')).toBe(false)
    })

    it('retorna false para cookie vazio', () => {
      expect(isPortalSessionValid('', 'tok')).toBe(false)
    })

    it('retorna false para formato inválido', () => {
      expect(isPortalSessionValid('invalid', 'tok')).toBe(false)
    })

    it('retorna false para sessão expirada', () => {
      const pastExp = Date.now() - 100000
      const fakePayload = `oldtoken.${pastExp}`
      const { value } = createPortalSessionValue('oldtoken')
      const sigIndex = value.lastIndexOf('.')
      const fakeValue = fakePayload + value.slice(sigIndex)
      expect(isPortalSessionValid(fakeValue, 'oldtoken')).toBe(false)
    })

    it('retorna false para assinatura inválida', () => {
      const { value } = createPortalSessionValue('tok')
      const tampered = value + 'x'
      expect(isPortalSessionValid(tampered, 'tok')).toBe(false)
    })

    it('retorna false quando NEXTAUTH_SECRET não está configurado', () => {
      delete process.env.NEXTAUTH_SECRET
      expect(() => createPortalSessionValue('tok')).toThrow('NEXTAUTH_SECRET não configurado.')
    })
  })
})
