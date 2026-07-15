import { describe, it, expect } from 'vitest'
import { DEFAULT_PORTAL_CONFIG, shouldShowSensitiveData } from '@/lib/portal-config'

describe('DEFAULT_PORTAL_CONFIG', () => {
  it('showCalculations é true', () => {
    expect(DEFAULT_PORTAL_CONFIG.showCalculations).toBe(true)
  })

  it('showRetroactives é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.showRetroactives).toBe(false)
  })

  it('showBpcSocialAnalysis é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.showBpcSocialAnalysis).toBe(false)
  })

  it('requireIdentity é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.requireIdentity).toBe(false)
  })

  it('showTimeline é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.showTimeline).toBe(false)
  })

  it('showDocuments é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.showDocuments).toBe(false)
  })

  it('showFaq é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.showFaq).toBe(false)
  })

  it('showGlossary é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.showGlossary).toBe(false)
  })

  it('showPdfExport é false', () => {
    expect(DEFAULT_PORTAL_CONFIG.showPdfExport).toBe(false)
  })
})

describe('shouldShowSensitiveData', () => {
  it('retorna false quando a config está desligada, mesmo com identidade verificada', () => {
    expect(shouldShowSensitiveData(false, true)).toBe(false)
  })

  it('retorna false quando a identidade não foi verificada, mesmo com a config ligada', () => {
    expect(shouldShowSensitiveData(true, false)).toBe(false)
  })

  it('retorna true apenas quando ambos são verdadeiros', () => {
    expect(shouldShowSensitiveData(true, true)).toBe(true)
  })
})
