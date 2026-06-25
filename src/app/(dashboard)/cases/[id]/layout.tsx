'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import api from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, LayoutDashboard, MessageSquare, FileText, Calculator, BarChart3, History, CheckSquare, Bot, Lock, Building2, GitCompareArrows } from 'lucide-react'

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

const BENEFIT_LABELS: Record<string, string> = {
  APOSENTADORIA_IDADE: 'Apos. por Idade',
  APOSENTADORIA_TEMPO_CONTRIBUICAO: 'Apos. por TC',
  APOSENTADORIA_ESPECIAL: 'Apos. Especial',
  APOSENTADORIA_HIBRIDA: 'Apos. Híbrida',
  APOSENTADORIA_PONTOS: 'Apos. por Pontos',
  AUXILIO_DOENCA: 'Auxílio-Doença',
  AUXILIO_ACIDENTE: 'Auxílio-Acidente',
  SALARIO_MATERNIDADE: 'Sal. Maternidade',
  AUXILIO_RECLUSAO: 'Aux. Reclusão',
  PENSAO_POR_MORTE: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
  REVISAO_BENEFICIO: 'Revisão Benefício',
}

const STATUS_LABELS: Record<string, string> = {
  PROSPECCAO: 'Prospecção',
  ANALISE: 'Análise',
  PRONTO_PARA_REQUERER: 'Pronto p/ Requerer',
  EM_PROCESSAMENTO: 'Em Processamento',
  FINALIZADO: 'Finalizado',
}

const PRIORITY_STYLES: Record<string, { label: string, color: 'lime' | 'red' | 'yellow' | 'slate' | 'blue' | 'green' }> = {
  CRITICAL: { label: 'Crítico', color: 'red' },
  ATTENTION: { label: 'Atenção', color: 'yellow' },
  NORMAL: { label: 'Normal', color: 'slate' },
}

export default function CaseLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const [caseData, setCaseData] = useState<CaseHeader | null>(null)

  useEffect(() => {
    api.get(`/cases/${params.id}`)
      .then((r) => setCaseData(r.data.case))
      .catch(() => null)
  }, [params.id])

  const basePath = `/cases/${params.id}`

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard, path: '' },
    { id: 'notes', label: 'Prontuário', icon: MessageSquare, path: '/notes' },
    { id: 'cnis', label: 'Análise CNIS', icon: FileText, path: '/cnis' },
    { id: 'calculator', label: 'Cálculos', icon: Calculator, path: '/calculator' },
    { id: 'simulator', label: 'Simulação', icon: BarChart3, path: '/simulator', locked: caseData ? !caseData.planLimits?.simulatorEnabled : false },
    { id: 'retroativos', label: 'Retroativos', icon: History, path: '/retroativos', locked: caseData ? !caseData.planLimits?.retroativosEnabled : false },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, path: '/checklist' },
    { id: 'opinions', label: 'Parecer IA', icon: Bot, path: '/opinions' },
    { id: 'compare', label: 'Comparar', icon: GitCompareArrows, path: '/compare' },
    ...(caseData?.benefitType === 'BPC_LOAS'
      ? [{ id: 'bpc', label: 'BPC/LOAS', icon: Building2, path: '/bpc', locked: !caseData.planLimits?.bpcEnabled }]
      : []),
  ]

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
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
                      {BENEFIT_LABELS[caseData.benefitType] ?? caseData.benefitType}
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

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto custom-scrollbar no-scrollbar-on-mobile pb-px">
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

      {/* Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </div>
    </div>
  )
}
