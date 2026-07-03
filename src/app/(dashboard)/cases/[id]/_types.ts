export interface CaseDetail {
  id: string
  status: string
  benefitType: string
  priority: string
  notes: string | null
  deadlineDate: string | null
  createdAt: string
  updatedAt: string
  client: { id: string; name: string; phone: string | null }
  cnisDocument: { processingStatus: string } | null
  _count: { caseNotes: number; calculations: number; checklists: number }
  planLimits?: {
    simulatorEnabled: boolean
    retroativosEnabled: boolean
    bpcEnabled: boolean
    diagnosisEnabled: boolean
    peticaoEnabled: boolean
  }
  portalConfig?: {
    showCalculations: boolean
    showRetroactives: boolean
    showInterpretation: boolean
    requireIdentity: boolean
  }
}
