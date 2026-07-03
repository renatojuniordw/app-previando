export interface PortalConfig {
  showCalculations: boolean
  showRetroactives: boolean
  showInterpretation: boolean
  requireIdentity: boolean
}

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
  showCalculations: true,
  showRetroactives: false,
  showInterpretation: false,
  requireIdentity: false,
}
