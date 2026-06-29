export interface InterpretOutput {
  urgency: 'CRITICAL' | 'ACTION_REQUIRED' | 'INFORMATIVE'
  urgencyLabel: string
  interpretation: string
  suggestedAction?: string
}
