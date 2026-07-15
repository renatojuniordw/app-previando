export interface PortalConfig {
  showCalculations: boolean
  showRetroactives: boolean
  showBpcSocialAnalysis: boolean
  showTimeline: boolean
  showDocuments: boolean
  showFaq: boolean
  showGlossary: boolean
  showPdfExport: boolean
  requireIdentity: boolean
}

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
  showCalculations: true,
  showRetroactives: false,
  showBpcSocialAnalysis: false,
  showTimeline: false,
  showDocuments: false,
  showFaq: false,
  showGlossary: false,
  showPdfExport: false,
  requireIdentity: false,
}

export function shouldShowSensitiveData(configFlag: boolean, identityVerified: boolean): boolean {
  return configFlag && identityVerified
}
