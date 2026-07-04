'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, LayoutDashboard, FileText, Calculator, BarChart3, History, Lock, Building2, GitCompareArrows, Files, ShieldAlert, Clock, DollarSign, Scale, Receipt } from 'lucide-react'
import { BENEFIT_SHORT_LABELS, STATUS_LABELS, PRIORITY_STYLES } from '@/lib/constants'
import { CaseFloatingActions } from '@/components/case/CaseFloatingActions'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useCaseData } from './CaseContext'

const CaseNotesDrawer = dynamic(
  () => import('@/components/case/CaseNotesDrawer').then(m => ({ default: m.CaseNotesDrawer })),
  { ssr: false }
)
const CaseChecklistDrawer = dynamic(
  () => import('@/components/case/CaseChecklistDrawer').then(m => ({ default: m.CaseChecklistDrawer })),
  { ssr: false }
)
const CaseOpinionsDrawer = dynamic(
  () => import('@/components/case/CaseOpinionsDrawer').then(m => ({ default: m.CaseOpinionsDrawer })),
  { ssr: false }
)
const CaseBpcDrawer = dynamic(
  () => import('@/components/case/CaseBpcDrawer').then(m => ({ default: m.CaseBpcDrawer })),
  { ssr: false }
)
const CasePeticaoModal = dynamic(
  () => import('@/components/case/CasePeticaoModal').then(m => ({ default: m.CasePeticaoModal })),
  { ssr: false }
)

export function CaseLayoutClient({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: caseData } = useCaseData()

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

  const basePath = `/cases/${params.id}`

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard, path: '' },
    { id: 'cnis', label: 'Análise CNIS', icon: FileText, path: '/cnis' },
    { id: 'calculator', label: 'Cálculos', icon: Calculator, path: '/calculator' },
    { id: 'simulator', label: 'Simulação', icon: BarChart3, path: '/simulator', locked: caseData ? !caseData.planLimits?.simulatorEnabled : false },
    { id: 'prescricao', label: 'Prescrição', icon: ShieldAlert, path: '/prescricao' },
    { id: 'retroativos', label: 'Retroativos', icon: History, path: '/retroativos', locked: caseData ? !caseData.planLimits?.retroativosEnabled : false },
    { id: 'honorarios', label: 'Honorários', icon: DollarSign, path: '/honorarios' },
    { id: 'compare', label: 'Comparar', icon: GitCompareArrows, path: '/compare' },
    { id: 'gps', label: 'GPS/DAS', icon: Receipt, path: '/gps' },
    { id: 'revisao', label: 'Revisão', icon: Scale, path: '/revisao', locked: caseData ? !caseData.planLimits?.revisionEnabled : false },
    { id: 'timeline', label: 'Timeline', icon: Clock, path: '/timeline' },
    { id: 'pdf', label: 'Ferramentas PDF', icon: Files, path: '/pdf' },

    ...(caseData?.benefitType === 'BPC_LOAS'
      ? [{ id: 'bpc', label: 'BPC/LOAS', icon: Building2, path: '/bpc', locked: !caseData.planLimits?.bpcEnabled }]
      : []),
  ]

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="py-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              {caseData ? (
                <>
                  <Link
                    href={`/clients/list/${caseData.client.id}`}
                    className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-slate-500 hover:text-amber-600 transition-colors mb-3"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para {caseData.client.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 tracking-tight">
                      {BENEFIT_SHORT_LABELS[caseData.benefitType] ?? caseData.benefitType}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 md:mt-0">
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

          <div className="border-b border-slate-200">
            <div className="flex gap-1 overflow-x-auto custom-scrollbar no-scrollbar-on-mobile -mb-px" role="tablist" aria-label="Navegação do caso">
              {tabs.map((tab) => {
                const fullPath = `${basePath}${tab.path}`
                const isActive = tab.path === ''
                  ? pathname === basePath || pathname === basePath + '/'
                  : pathname.startsWith(fullPath)
                const Icon = tab.icon

                return (
                  <Link
                    key={tab.id}
                    href={tab.locked ? '' : fullPath}
                    prefetch={tab.locked ? false : undefined}
                    role="tab"
                    aria-selected={isActive}
                    aria-disabled={tab.locked || undefined}
                    tabIndex={tab.locked ? -1 : 0}
                    onClick={tab.locked ? (e) => e.preventDefault() : undefined}
                    className={`
                      flex items-center gap-2 px-4 py-3 font-sans font-medium text-sm whitespace-nowrap border-b-2 transition-all
                      ${isActive
                        ? 'border-amber-500 text-amber-700 bg-amber-50/50'
                        : tab.locked
                          ? 'border-transparent text-slate-400 cursor-not-allowed opacity-60'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                      }
                    `}
                    title={tab.locked ? 'Recurso bloqueado no seu plano' : ''}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                    {tab.label}
                    {tab.locked && <Lock className="w-3 h-3 ml-1 text-slate-400" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8" role="tabpanel" aria-labelledby="tab-content">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>

      <CasePeticaoModal
        open={activeDrawer === 'peticao'}
        onClose={() => setDrawer(null)}
        caseId={params.id as string}
      />

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

      <CaseFloatingActions
        activeDrawer={activeDrawer}
        setDrawer={setDrawer}
        benefitType={caseData?.benefitType}
      />
    </div>
  )
}
