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
}
