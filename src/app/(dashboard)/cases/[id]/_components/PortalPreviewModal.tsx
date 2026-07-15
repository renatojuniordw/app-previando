'use client'

import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { PortalContent } from '@/app/portal/[token]/PortalContent'
import { PortalBpcSection } from '@/app/portal/[token]/PortalBpcSection'
import type { CaseDetail } from '../_types'

interface Props {
  caseId: string
  config: NonNullable<CaseDetail['portalConfig']>
  onClose: () => void
}

interface PreviewData {
  benefitType: string
  calculations: Array<{
    modality: string
    rmi: number
    rma: number
    benefitSalary: number
    eligible: boolean
    expectedDib: string | null
    contributionTime: number | null
  }>
  retroactives: Array<{
    entitlementStartDate: string
    requestDate: string
    monthsLate: number
    totalGrossValue: number
    totalCorrectedValue: number
    finalNetValue: number
    correctionIndex: string
  }>
  bpcAnalysis: {
    tipoBpc: 'IDOSO' | 'DEFICIENCIA'
    patologia: string | null
    cid: string | null
    idade: number
    rendaFamiliar: number
    membrosGrupo: number
    rendaPerCapita: number
    preAnalise: string | null
    checklist: string | null
  } | null
}

export function PortalPreviewModal({ caseId, config, onClose }: Props) {
  const [data, setData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .post(`/cases/${caseId}/portal/preview`, config)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, config])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-50 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900">Prévia do Portal</h3>
            <p className="text-xs text-slate-400">Como o cliente veria com a configuração atual</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          )}
          {!loading && data && (
            <>
              <PortalContent
                token="preview"
                calculations={data.calculations.map((c) => ({
                  ...c,
                  expectedDib: c.expectedDib ? new Date(c.expectedDib) : null,
                }))}
                retroactives={data.retroactives.map((r) => ({
                  ...r,
                  entitlementStartDate: new Date(r.entitlementStartDate),
                  requestDate: new Date(r.requestDate),
                }))}
                requireIdentity={false}
                initialVerified={true}
              />
              {data.bpcAnalysis && <PortalBpcSection analysis={data.bpcAnalysis} />}
              {data.calculations.length === 0 && data.retroactives.length === 0 && !data.bpcAnalysis && (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nenhuma informação está ativada para exibição no portal.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
