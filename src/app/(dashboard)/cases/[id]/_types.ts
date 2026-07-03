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
  processNumber: string | null
  processLastCheck: string | null
  processLastMovDate: string | null
  processLastMovCount: number | null
  processLastSummary: string | null
  planLimits?: {
    simulatorEnabled: boolean
    retroativosEnabled: boolean
    bpcEnabled: boolean
    diagnosisEnabled: boolean
    peticaoEnabled: boolean
    processInterpretEnabled: boolean
  }
  portalConfig?: {
    showProcessTracking: boolean
    showCalculations: boolean
    showRetroactives: boolean
    showInterpretation: boolean
    requireIdentity: boolean
  }
}
