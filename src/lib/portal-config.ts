export interface PortalConfig {
  showCalculations: boolean
  showRetroactives: boolean
  showBpcSocialAnalysis: boolean
  requireIdentity: boolean
}

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
  showCalculations: true,
  showRetroactives: false,
  showBpcSocialAnalysis: false,
  requireIdentity: false,
}

export function shouldShowSensitiveData(configFlag: boolean, identityVerified: boolean): boolean {
  return configFlag && identityVerified
}
