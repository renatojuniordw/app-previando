'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, LayoutDashboard, FileText, Calculator, BarChart3, History, Lock, Building2, GitCompareArrows } from 'lucide-react'
import { BENEFIT_SHORT_LABELS, STATUS_LABELS, PRIORITY_STYLES } from '@/lib/constants'
import { CaseNotesDrawer } from '@/components/case/CaseNotesDrawer'
import { CaseChecklistDrawer } from '@/components/case/CaseChecklistDrawer'
import { CaseOpinionsDrawer } from '@/components/case/CaseOpinionsDrawer'
import { CaseBpcDrawer } from '@/components/case/CaseBpcDrawer'
import { CaseFloatingActions } from '@/components/case/CaseFloatingActions'

interface CaseHeader {
  id: string
  status: string
  benefitType: string
  priority: string
  client: { id: string; name: string }
  planLimits: {
    simulatorEnabled: boolean
    retroativosEnabled: boolean
    bpcEnabled: boolean
  }
}



export default function CaseLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [caseData, setCaseData] = useState<CaseHeader | null>(null)

  const activeDrawer = searchParams.get('drawer')

  const setDrawer = (drawerName: string | null) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    if (drawerName) {
      nextParams.set('drawer', drawerName)
    } else {
      nextParams.delete('drawer')
    }
    router.replace(`${pathname}?${nextParams.toString()}`)
  }

  useEffect(() => {
    api.get(`/cases/${params.id}`)
      .then((r) => setCaseData(r.data.case))
      .catch(() => null)
  }, [params.id])

  const basePath = `/cases/${params.id}`

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard, path: '' },
    { id: 'cnis', label: 'Análise CNIS', icon: FileText, path: '/cnis' },
    { id: 'calculator', label: 'Cálculos', icon: Calculator, path: '/calculator' },
    { id: 'simulator', label: 'Simulação', icon: BarChart3, path: '/simulator', locked: caseData ? !caseData.planLimits?.simulatorEnabled : false },
    { id: 'retroativos', label: 'Retroativos', icon: History, path: '/retroativos', locked: caseData ? !caseData.planLimits?.retroativosEnabled : false },
    { id: 'compare', label: 'Comparar', icon: GitCompareArrows, path: '/compare' },
    ...(caseData?.benefitType === 'BPC_LOAS'
      ? [{ id: 'bpc', label: 'BPC/LOAS', icon: Building2, path: '/bpc', locked: !caseData.planLimits?.bpcEnabled }]
      : []),
  ]

  return (
    <div className="flex flex-column min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="py-6 flex flex-column md:flex-row md:align-items-start justify-content-between gap-4">
            <div>
              {caseData ? (
                <>
                  <Link
                    href={`/clients/list/${caseData.client.id}`}
                    className="inline-flex align-items-center gap-1.5 font-sans text-sm font-medium text-slate-500 hover:text-[var(--color-primary)] transition-colors mb-3"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para {caseData.client.name}
                  </Link>
                  <div className="flex flex-wrap align-items-center gap-3">
                    <h1 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 tracking-tight">
                      {BENEFIT_SHORT_LABELS[caseData.benefitType] ?? caseData.benefitType}
                    </h1>
                    <div className="flex align-items-center gap-2 mt-1 md:mt-0">
                      <Badge variant="slate" className="bg-slate-100 text-slate-700 border-slate-200">
                        {STATUS_LABELS[caseData.status] ?? caseData.status}
                      </Badge>
                      <Badge variant={PRIORITY_STYLES[caseData.priority]?.color ?? 'slate'}>
                        {PRIORITY_STYLES[caseData.priority]?.label}
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                  <div className="h-8 w-64 bg-slate-100 rounded animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-slate-200">
            <div className="flex gap-1 overflow-x-auto custom-scrollbar no-scrollbar-on-mobile -mb-px">
              {tabs.map((tab) => {
                const fullPath = `${basePath}${tab.path}`
                const isActive = tab.path === ''
                  ? pathname === basePath || pathname === basePath + '/'
                  : pathname.startsWith(fullPath)
                const Icon = tab.icon

                return (
                  <Link
                    key={tab.id}
                    href={tab.locked ? '#' : fullPath}
                    className={`
                      flex align-items-center gap-2 px-4 py-3 font-sans font-medium text-sm whitespace-nowrap border-b-2 transition-all
                      ${isActive
                        ? 'border-[var(--color-primary)] text-[var(--color-primary-dark)] bg-[rgba(242,232,228,0.5)]'
                        : tab.locked
                          ? 'border-transparent text-slate-400 cursor-not-allowed opacity-60'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                      }
                    `}
                    title={tab.locked ? 'Recurso bloqueado no seu plano' : ''}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--color-primary)]' : 'text-slate-400'}`} />
                    {tab.label}
                    {tab.locked && <Lock className="w-3 h-3 ml-1 text-slate-400" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </div>

      {/* Slide-out Drawers */}
      <CaseNotesDrawer
        open={activeDrawer === 'notes'}
        onClose={() => setDrawer(null)}
        caseId={params.id as string}
      />
      <CaseChecklistDrawer
        open={activeDrawer === 'checklist'}
        onClose={() => setDrawer(null)}
        caseId={params.id as string}
      />
      <CaseOpinionsDrawer
        open={activeDrawer === 'opinions'}
        onClose={() => setDrawer(null)}
        caseId={params.id as string}
      />
      {caseData?.benefitType === 'BPC_LOAS' && (
        <CaseBpcDrawer
          open={activeDrawer === 'bpc'}
          onClose={() => setDrawer(null)}
          caseId={params.id as string}
        />
      )}

      {/* Floating Action Button (FAB) Speed Dial */}
      <CaseFloatingActions
        activeDrawer={activeDrawer}
        setDrawer={setDrawer}
        benefitType={caseData?.benefitType}
      />
    </div>
  )
}
