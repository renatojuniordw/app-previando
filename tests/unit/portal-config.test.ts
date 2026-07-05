import { describe, it, expect } from 'vitest'
import { DEFAULT_PORTAL_CONFIG } from '@/lib/portal-config'

describe('DEFAULT_PORTAL_CONFIG', () => {
  it('showCalculations é true', () => {
    expect(DEFAULT_PORTAL_CONFIG.showCalculations).toBe(true)
  })

  it('showRetroactives é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.showRetroactives).toBe(false)
  })

  it('showInterpretation é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.showInterpretation).toBe(false)
  })

  it('requireIdentity é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.requireIdentity).toBe(false)
  })
})
