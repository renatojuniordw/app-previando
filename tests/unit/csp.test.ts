import { describe, it, expect } from 'vitest'
import { buildCSP } from '@/lib/csp'

describe('buildCSP', () => {
  it('inclui default-src self', () => {
    const csp = buildCSP('abc123')
    expect(csp).toContain("default-src 'self'")
  })

  it('inclui nonce em script-src', () => {
    const csp = buildCSP('test-nonce')
    expect(csp).toContain("'nonce-test-nonce'")
  })

  it('inclui unsafe-inline em style-src', () => {
    const csp = buildCSP('abc')
    expect(csp).toContain("style-src 'self' 'unsafe-inline'")
  })

  it('inclui img-src com fontes permitidas', () => {
    const csp = buildCSP('abc')
    expect(csp).toContain("img-src 'self' data: https://images.unsplash.com https://lh3.googleusercontent.com")
  })

  it('inclui font-src self', () => {
    const csp = buildCSP('abc')
    expect(csp).toContain("font-src 'self'")
  })

  it('inclui frame-src com blob', () => {
    const csp = buildCSP('abc')
    expect(csp).toContain("frame-src 'self' blob:")
  })

  it('inclui frame-ancestors none', () => {
    const csp = buildCSP('abc')
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('inclui base-uri self', () => {
    const csp = buildCSP('abc')
    expect(csp).toContain("base-uri 'self'")
  })

  it('inclui form-action self', () => {
    const csp = buildCSP('abc')
    expect(csp).toContain("form-action 'self'")
  })

  it('não inclui unsafe-eval em production (wasm-unsafe-eval é permitido, é mais restrito)', () => {
    const originalEnv = process.env.NODE_ENV
    ;(process.env as any).NODE_ENV = 'production'
    const csp = buildCSP('abc')
    expect(csp).not.toContain("'unsafe-eval'")
    ;(process.env as any).NODE_ENV = originalEnv
  })

  it('diretivas são separadas por ; ', () => {
    const csp = buildCSP('abc')
    const directives = csp.split('; ')
    expect(directives.length).toBeGreaterThan(5)
  })

  it('inclui unsafe-eval em development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.resetModules()
    const { buildCSP: buildCSPDev } = await import('@/lib/csp')
    const csp = buildCSPDev('dev-nonce')
    expect(csp).toContain("'unsafe-eval'")
    expect(csp).toContain("ws: wss:")
    vi.unstubAllEnvs()
  })
})
