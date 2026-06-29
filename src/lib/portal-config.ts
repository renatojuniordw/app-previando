export interface PortalConfig {
  showProcessTracking: boolean
  showCalculations: boolean
  showRetroactives: boolean
  showInterpretation: boolean
  requireIdentity: boolean
}

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
  showProcessTracking: true,
  showCalculations: true,
  showRetroactives: false,
  showInterpretation: false,
  requireIdentity: false,
}
