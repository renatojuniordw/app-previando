'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { 
  ArrowLeft, LayoutDashboard, FileText, Calculator, BarChart3, 
  History, Building2, GitCompareArrows, Files, ShieldAlert,
  Clock, DollarSign, Scale, Receipt, ChevronDown, X 
} from 'lucide-react'
import { BENEFIT_SHORT_LABELS, STATUS_LABELS, PRIORITY_STYLES } from '@/lib/constants'
import { CaseFloatingActions } from '@/components/case/CaseFloatingActions'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { FeatureLockedTeaser } from '@/components/plan/FeatureLockedTeaser'
import { PLAN_DISPLAY_NAMES } from '@/lib/feature-marketing'
import { useCaseData } from './CaseContext'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { cn } from '@/lib/utils'

// Abas bloqueadas continuam navegáveis: o conteúdo real é substituído pelo
// FeatureLockedTeaser (degustação + CTA de upgrade). Ver docs/Para o nicho
// de advocacia previdenciária.md — esconder ou travar o clique mata o desejo
// de upgrade; mostrar a ferramenta bloqueada gera conversão contextual.
const LOCKED_TAB_INFO: Record<string, { feature: string; upgradeRequired: string }> = {
  calculator: { feature: 'CALCULATIONS', upgradeRequired: 'SOLO' },
  simulator: { feature: 'SIMULATOR', upgradeRequired: 'SOLO' },
  retroativos: { feature: 'RETROATIVOS', upgradeRequired: 'SOLO' },
  gps: { feature: 'GPS_MODULE', upgradeRequired: 'SOLO' },
  revisao: { feature: 'REVISION_MODULE', upgradeRequired: 'SOLO' },
  bpc: { feature: 'USE_BPC_MODULE', upgradeRequired: 'SOLO' },
}

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

const CATEGORIES = [
  {
    id: 'geral',
    label: 'Geral',
    itemIds: ['overview', 'timeline']
  },
  {
    id: 'calculos',
    label: 'Cálculos & Análise',
    itemIds: ['cnis', 'calculator', 'simulator', 'compare']
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    itemIds: ['retroativos', 'honorarios', 'gps']
  },
  {
    id: 'juridico',
    label: 'Jurídico & Utilitários',
    itemIds: ['prescricao', 'revisao', 'bpc', 'pdf']
  }
]

export function CaseLayoutClient({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: caseData } = useCaseData()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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
    { id: 'calculator', label: 'Cálculos', icon: Calculator, path: '/calculator', locked: caseData ? !caseData.planLimits?.simulatorEnabled : false },
    { id: 'simulator', label: 'Simulação', icon: BarChart3, path: '/simulator', locked: caseData ? !caseData.planLimits?.simulatorEnabled : false },
    { id: 'prescricao', label: 'Prescrição', icon: ShieldAlert, path: '/prescricao' },
    { id: 'retroativos', label: 'Retroativos', icon: History, path: '/retroativos', locked: caseData ? !caseData.planLimits?.retroativosEnabled : false },
    { id: 'honorarios', label: 'Honorários', icon: DollarSign, path: '/honorarios' },
    { id: 'compare', label: 'Comparar', icon: GitCompareArrows, path: '/compare' },
    { id: 'gps', label: 'GPS/DAS', icon: Receipt, path: '/gps', locked: caseData ? !caseData.planLimits?.gpsEnabled : false },
    { id: 'revisao', label: 'Revisão', icon: Scale, path: '/revisao', locked: caseData ? !caseData.planLimits?.revisionEnabled : false },
    { id: 'timeline', label: 'Timeline', icon: Clock, path: '/timeline' },
    { id: 'pdf', label: 'Ferramentas PDF', icon: Files, path: '/pdf' },

    ...(caseData?.benefitType === 'BPC_LOAS'
      ? [{ id: 'bpc', label: 'BPC/LOAS', icon: Building2, path: '/bpc', locked: !caseData.planLimits?.bpcEnabled }]
      : []),
  ]

  // Encontra qual aba está ativa com base na rota
  const activeTab = tabs.find((tab) => {
    const fullPath = `${basePath}${tab.path}`
    return tab.path === ''
      ? pathname === basePath || pathname === basePath + '/'
      : pathname.startsWith(fullPath)
  }) || tabs[0]

  const ActiveIcon = activeTab.icon

  // Fecha o menu mobile ao trocar de página
  useEffect(() => {
    setShowMobileMenu(false)
  }, [pathname])

  return (
    <div className="flex flex-col min-h-full bg-slate-50/30">
      {/* Top Header Card */}
      <div className="bg-white border-b border-slate-200 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-3 md:py-4">
          {caseData ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <Link
                  href={`/clients/list/${caseData.client.id}`}
                  className="inline-flex items-center gap-1.5 font-sans text-xs font-bold text-slate-400 hover:text-amber-700 transition-colors mb-1 md:mb-3 uppercase tracking-wider"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Voltar para {caseData.client.name}</span>
                  <span className="sm:hidden">Voltar</span>
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="font-serif font-bold text-xl md:text-2xl lg:text-3xl text-slate-900 tracking-tight leading-none">
                    {BENEFIT_SHORT_LABELS[caseData.benefitType] ?? caseData.benefitType}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="slate" className="bg-slate-50 text-slate-655 border-slate-200 uppercase text-[9px] font-extrabold tracking-wider px-2 py-0.5">
                      {STATUS_LABELS[caseData.status] ?? caseData.status}
                    </Badge>
                    <Badge variant={PRIORITY_STYLES[caseData.priority]?.color ?? 'slate'} className="uppercase text-[9px] font-extrabold tracking-wider px-2 py-0.5">
                      {PRIORITY_STYLES[caseData.priority]?.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
              <div className="h-8 w-64 bg-slate-100 rounded animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-8 py-8 pb-24 lg:pb-8 flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* Mobile Submenu Trigger */}
        <div className="lg:hidden w-full shrink-0">
          <button
            onClick={() => setShowMobileMenu(true)}
            className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm active:bg-slate-50 transition-colors"
            aria-label="Abrir menu de navegação entre seções"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <ActiveIcon className="w-4.5 h-4.5" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-sans text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Navegar seções</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-sans font-bold text-sm text-slate-800 truncate">{activeTab.label}</p>
                  <span className="shrink-0 flex items-center justify-center min-w-[20px] h-5 rounded-full bg-slate-100 border border-slate-200 px-1.5 text-[10px] font-bold text-slate-500">
                    {tabs.filter(t => !t.locked).length}
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
          </button>
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="sticky top-24 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-5">
            {CATEGORIES.map((cat) => {
              // Filtra as abas que pertencem a esta categoria e que estão disponíveis
              const catTabs = tabs.filter((t) => cat.itemIds.includes(t.id))
              if (catTabs.length === 0) return null

              return (
                <div key={cat.id} className="space-y-1.5">
                  <h4 className="font-sans text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">
                    {cat.label}
                  </h4>
                  <div className="space-y-0.5">
                    {catTabs.map((tab) => {
                      const fullPath = `${basePath}${tab.path}`
                      const isActive = tab.id === activeTab.id
                      const Icon = tab.icon

                      return (
                        <Link
                          key={tab.id}
                          href={fullPath}
                          prefetch={tab.locked ? false : undefined}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg font-sans text-xs transition-all duration-200 group border",
                            isActive
                              ? "bg-amber-50/55 border-amber-250 font-bold text-amber-800 shadow-xs"
                              : tab.locked
                                ? "border-transparent text-slate-500 hover:text-slate-700 hover:bg-amber-50/40 font-medium"
                                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-100 font-medium"
                          )}
                          title={tab.locked ? 'Disponível em planos pagos — clique para conhecer' : ''}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-amber-700" : "text-slate-400 group-hover:text-slate-500")} />
                            <span className="truncate">{tab.label}</span>
                          </div>
                          {tab.locked && (
                            <span className="font-sans text-[8px] font-extrabold uppercase tracking-wider bg-amber-100/80 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 shrink-0">
                              {PLAN_DISPLAY_NAMES[LOCKED_TAB_INFO[tab.id]?.upgradeRequired ?? 'SOLO']}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0" role="tabpanel" aria-labelledby="tab-content">
          <ErrorBoundary>
            {/* Aba bloqueada: o page component nem monta (nenhuma chamada de
                API é disparada) — só o teaser estático com CTA de upgrade. */}
            {activeTab.locked && LOCKED_TAB_INFO[activeTab.id] ? (
              <FeatureLockedTeaser
                feature={LOCKED_TAB_INFO[activeTab.id].feature}
                requiredPlan={LOCKED_TAB_INFO[activeTab.id].upgradeRequired}
              />
            ) : (
              children
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Navigation bottom sheet */}
      <BottomSheet
        open={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        title="Seções do Caso"
        className="lg:hidden"
      >
        <div className="px-5 pb-6 space-y-5">
          {CATEGORIES.map((cat) => {
            const catTabs = tabs.filter((t) => cat.itemIds.includes(t.id))
            if (catTabs.length === 0) return null

            return (
              <div key={cat.id} className="space-y-2">
                <h4 className="font-sans text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                  {cat.label}
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {catTabs.map((tab) => {
                    const fullPath = `${basePath}${tab.path}`
                    const isActive = tab.id === activeTab.id
                    const Icon = tab.icon

                    return (
                      <Link
                        key={tab.id}
                        href={fullPath}
                        prefetch={tab.locked ? false : undefined}
                        onClick={() => setShowMobileMenu(false)}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl border text-sm transition-all duration-200 active:bg-slate-50",
                          isActive
                            ? "bg-amber-50/60 border-amber-200 font-bold text-amber-800 shadow-xs"
                            : tab.locked
                              ? "border-slate-100 text-slate-500 hover:bg-amber-50/40 font-semibold"
                              : "border-slate-100 text-slate-600 hover:bg-slate-50 font-semibold"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0",
                            isActive ? "bg-amber-100/50 border-amber-200 text-amber-700" : "bg-slate-50 border-slate-150 text-slate-400"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {tab.locked && (
                          <span className="shrink-0 font-sans text-[8px] font-extrabold uppercase tracking-wider bg-amber-100/80 text-amber-800 border border-amber-200 rounded px-1 py-0.5">
                            {PLAN_DISPLAY_NAMES[LOCKED_TAB_INFO[tab.id]?.upgradeRequired ?? 'SOLO']}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </BottomSheet>

      {/* Floating Actions and Modals */}
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
