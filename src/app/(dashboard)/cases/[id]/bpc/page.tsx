'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PDFDownloadLink } from '@react-pdf/renderer'

import { BpcForm } from '@/components/bpc/BpcForm'
import { BpcResult } from '@/components/bpc/BpcResult'
import { BpcSocialInterview } from '@/components/bpc/BpcSocialInterview'
import { BpcConsolidatedPDFDocument } from '@/components/pdf/BpcConsolidatedPDFDocument'
import type { RelatoSocial } from '@/types/bpc-social'

interface BpcAnalysis {
  id: string
  patologia: string
  cid: string | null
  idade: number
  faixaEtaria: string
  rendaFamiliar: number
  membrosGrupo: number
  rendaPerCapita: number
  barreiras: string | null
  resumoLaudos: string | null
  preAnalise: string | null
  analiseLaudo: string | null
  perguntasSocial: string | null
  perguntasMedicas: string | null
  checklist: string | null
  relatoSocial: RelatoSocial | null
}

type AnalysisTab = 'preAnalise' | 'laudo' | 'social' | 'medical' | 'checklist'

const TABS: { id: AnalysisTab; label: string; field: keyof BpcAnalysis; endpoint: string }[] = [
  { id: 'preAnalise', label: 'Pré-Análise', field: 'preAnalise', endpoint: 'pre-analysis' },
  { id: 'laudo', label: 'Laudo', field: 'analiseLaudo', endpoint: 'laudo' },
  { id: 'social', label: 'Av. Social', field: 'perguntasSocial', endpoint: 'social' },
  { id: 'medical', label: 'Perícia Médica', field: 'perguntasMedicas', endpoint: 'medical' },
  { id: 'checklist', label: 'Checklist', field: 'checklist', endpoint: 'checklist' },
]

export default function BpcPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const caseId = params.id as string

  const [analysis, setAnalysis] = useState<BpcAnalysis | null>(null)
  const [clientBirthDate, setClientBirthDate] = useState<string | null>(null)
  const [bpcNotesCount, setBpcNotesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [activeTab, setActiveTab] = useState<AnalysisTab>('preAnalise')
  const [generatingTab, setGeneratingTab] = useState<AnalysisTab | null>(null)
  const [tabResults, setTabResults] = useState<Partial<Record<AnalysisTab, string>>>({})
  const [checklistImported, setChecklistImported] = useState(false)

  // Laudo input
  const [laudoText, setLaudoText] = useState('')
  const [laudoAnalyzing, setLaudoAnalyzing] = useState(false)

  // Confirmação de regeneração
  const [confirmingTab, setConfirmingTab] = useState<AnalysisTab | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/cases/${caseId}/bpc`)
      .then((r) => {
        setAnalysis(r.data.analysis ?? null)
        setClientBirthDate(r.data.clientBirthDate ?? null)
        setBpcNotesCount(r.data.bpcNotesCount ?? 0)

        // Pré-carrega os resultados salvos nas tabs
        const saved = r.data.analysis
        if (saved) {
          setTabResults({
            preAnalise: saved.preAnalise ?? undefined,
            laudo: saved.analiseLaudo ?? undefined,
            medical: saved.perguntasMedicas ?? undefined,
            checklist: saved.checklist ?? undefined,
          })
          // Abre na primeira tab que já tem resultado (social usa relatoSocial, não tabResults)
          const first = TABS.find((t) => t.id !== 'social' && saved[t.field])
          if (first) setActiveTab(first.id)
          else if (saved.relatoSocial) setActiveTab('social')
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [caseId])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: object) => {
    setSaving(true)
    try {
      const r = await api.post(`/cases/${caseId}/bpc`, data)
      setAnalysis(r.data)
    } catch {
      // error handled by api interceptor
    } finally {
      setSaving(false)
    }
  }

  const executeGenerate = async (tab: AnalysisTab) => {
    if (tab === 'laudo') {
      // O input do laudo agora fica integrado na tab, não precisa de modal
      return
    }
    const tabConfig = TABS.find((t) => t.id === tab)
    if (!tabConfig) return

    setGeneratingTab(tab)
    setActiveTab(tab)
    try {
      const r = await api.post(`/cases/${caseId}/bpc/${tabConfig.endpoint}`, {})
      setTabResults((prev) => ({ ...prev, [tab]: r.data.result }))
      if (tab === 'checklist') setChecklistImported(false)
      if (r.data.bpcNotesCount !== undefined) setBpcNotesCount(r.data.bpcNotesCount)
    } catch {
      // error handled by api interceptor
    } finally {
      setGeneratingTab(null)
    }
  }

  const handleGenerate = (tab: AnalysisTab | null) => {
    if (!tab) return
    executeGenerate(tab)
  }

  const handleRegenerateRequest = (tab: AnalysisTab) => {
    setConfirmingTab(tab)
  }

  const handleConfirmRegenerate = () => {
    if (!confirmingTab) return
    const tab = confirmingTab
    setConfirmingTab(null)
    executeGenerate(tab)
  }

  const handleLaudoAnalysis = async () => {
    if (!laudoText.trim()) return
    setLaudoAnalyzing(true)
    try {
      const r = await api.post(`/cases/${caseId}/bpc/laudo`, { texto: laudoText })
      setTabResults((prev) => ({ ...prev, laudo: r.data.result }))
      setActiveTab('laudo')
      if (r.data.bpcNotesCount !== undefined) setBpcNotesCount(r.data.bpcNotesCount)
      setLaudoText('')
    } catch {
      // error handled by api interceptor
    } finally {
      setLaudoAnalyzing(false)
    }
  }

  const openChecklist = () => {
    const next = new URLSearchParams(searchParams.toString())
    next.set('drawer', 'checklist')
    router.replace(`${pathname}?${next.toString()}`)
  }

  const openNotes = () => {
    const next = new URLSearchParams(searchParams.toString())
    next.set('drawer', 'notes')
    router.replace(`${pathname}?${next.toString()}`)
  }

  const activeResult = tabResults[activeTab] ?? null
  const activeTabConfig = TABS.find((t) => t.id === activeTab)!

  const completedCount = TABS.filter((t) =>
    t.id === 'social' ? !!analysis?.relatoSocial : !!tabResults[t.id]
  ).length

  const handleCopy = () => { if (activeResult) navigator.clipboard.writeText(activeResult) }

  if (loading) {
    return (
      <div className="flex align-items-center justify-content-center py-12">
        <span className="neo-spinner text-[var(--color-primary)] mr-2" />
        <span className="font-sans text-sm text-slate-500">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans">
      <div className="flex flex-column md:flex-row md:align-items-center justify-content-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="font-serif font-semibold text-2xl text-slate-900 tracking-tight">BPC/LOAS</h2>
          <p className="font-sans text-sm text-slate-500 mt-1">Análise técnica e documental com Inteligência Artificial</p>
        </div>
        
        <div className="flex align-items-center gap-3 flex-wrap shrink-0">
          {/* PDF consolidado — aparece quando há ao menos 1 análise concluída */}
          {completedCount > 0 && (
            <PDFDownloadLink
              document={
                <BpcConsolidatedPDFDocument
                  generatedAt={new Date().toLocaleDateString('pt-BR')}
                  sections={TABS.flatMap((t) => {
                    if (t.id === 'social') return []
                    const content = tabResults[t.id]
                    if (!content) return []
                    return [{ type: t.id, label: t.label, content }]
                  })}
                />
              }
              fileName={`previando-bpc-completo-${caseId}.pdf`}
              className="inline-flex align-items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-full bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              📄 Relatório Completo
            </PDFDownloadLink>
          )}

          {bpcNotesCount > 0 && (
            <div className="flex align-items-center gap-2 bg-slate-900 text-slate-200 px-3 py-1.5 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {bpcNotesCount} {bpcNotesCount === 1 ? 'registro no prontuário' : 'registros no prontuário'}
              <button
                onClick={openNotes}
                className="ml-2 pl-2 border-l border-slate-700 text-[var(--color-primary-hover)] hover:text-[#EB8B6A] transition-colors"
              >
                Visualizar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 align-items-start">
        {/* COLUNA ESQUERDA: DADOS (33%) */}
        <div className="lg:col-span-4 flex flex-column gap-6">
          <BpcForm
            caseId={caseId}
            analysis={analysis}
            clientBirthDate={clientBirthDate}
            onSave={handleSave}
            saving={saving}
          />
        </div>

        {/* COLUNA DIREITA: COMMAND CENTER IA (66%) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl overflow-hidden flex flex-column h-full min-h-[650px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {/* Header IA Command Center */}
            <div className="px-6 py-4 border-b border-slate-100 flex align-items-center justify-content-between bg-slate-50/50">
              <div className="flex align-items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
                <h3 className="font-sans text-sm font-semibold text-slate-700 ml-2">
                  BPC Inteligência Artificial
                </h3>
              </div>
              <div className="flex align-items-center gap-3">
                {analysis && (
                  <div className="flex align-items-center gap-2">
                    <div className="flex gap-0.5">
                      {TABS.map((t) => {
                        const done = t.id === 'social' ? !!analysis?.relatoSocial : !!tabResults[t.id]
                        return (
                          <div
                            key={t.id}
                            className={`w-5 h-1.5 rounded-full transition-colors ${done ? 'bg-emerald-500' : 'bg-slate-200'}`}
                          />
                        )
                      })}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {completedCount}/{TABS.length}
                    </span>
                  </div>
                )}
                {generatingTab && (
                  <div className="flex align-items-center gap-2">
                    <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-ping" />
                    <span className="text-xs font-mono text-[var(--color-primary)]/80">PROCESSANDO</span>
                  </div>
                )}
              </div>
            </div>

            {/* Layout Interno do Command Center (Tabs na lateral vs Topo) */}
            <div className="flex flex-column md:flex-row flex-1">
              {/* Tabs / Menu Esquerdo do Command Center */}
              <div className="w-full md:w-48 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 p-3">
                <div className="flex md:flex-column gap-1 overflow-x-auto no-scrollbar">
                  {TABS.map((tab) => {
                    const hasSaved = tab.id === 'social'
                      ? !!analysis?.relatoSocial
                      : !!tabResults[tab.id]
                    const isActive = activeTab === tab.id
                    const isGenerating = generatingTab === tab.id
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex align-items-center justify-content-between w-full px-3 py-2.5 rounded-md text-xs font-sans font-medium transition-all text-left whitespace-nowrap ${
                          isActive
                            ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary-dark)] shadow-sm border border-[#F5D0C3]'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-transparent'
                        }`}
                      >
                        <span className="truncate">{tab.label}</span>
                        {isGenerating ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse ml-2 shrink-0" />
                        ) : hasSaved ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-2 shrink-0 opacity-80" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-2 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Área Principal de Conteúdo IA */}
              <div className="flex-1 flex flex-column bg-white relative">
                {activeTab === 'social' ? (
                  <div className="p-0 h-full [&>div]:h-full [&>div]:bg-transparent [&>div]:border-none [&>div]:shadow-none">
                    <BpcSocialInterview
                      caseId={caseId}
                      analysisExists={!!analysis}
                      relatoSocial={analysis?.relatoSocial ?? null}
                      onRelatoChange={(relato) =>
                        setAnalysis((prev) => prev ? { ...prev, relatoSocial: relato } : null)
                      }
                      onNoteSaved={setBpcNotesCount}
                    />
                  </div>
                ) : !analysis ? (
                  <div className="flex-1 flex flex-column align-items-center justify-content-center p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex align-items-center justify-content-center mb-4 border border-slate-100">
                      <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                      </svg>
                    </div>
                    <h4 className="font-sans font-semibold text-slate-700 mb-2">Dados não preenchidos</h4>
                    <p className="font-sans text-sm text-slate-500 max-w-sm">
                      Preencha e salve os dados do caso na coluna ao lado para liberar as análises de inteligência artificial.
                    </p>
                  </div>
                ) : generatingTab === activeTab ? (
                  <div className="flex-1 flex flex-column p-8">
                    <div className="flex align-items-center gap-3 mb-8">
                      <span className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-mono text-[var(--color-primary)]">GERANDO ANÁLISE...</span>
                    </div>
                    <div className="space-y-4 max-w-2xl">
                      <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
                      <div className="h-4 bg-slate-100 rounded w-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" style={{ animationDelay: '300ms' }} />
                      <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
                      <div className="h-4 bg-slate-100 rounded w-4/6 animate-pulse" style={{ animationDelay: '150ms' }} />
                    </div>
                  </div>
                ) : activeResult ? (
                  <div className="flex-1 p-0 overflow-hidden [&>div]:h-full [&>div]:bg-transparent [&>div]:border-none [&>div]:shadow-none">
                    <BpcResult
                      caseId={caseId}
                      result={activeResult}
                      type={activeTab}
                      onCopy={handleCopy}
                      onOpenChecklist={activeTab === 'checklist' ? openChecklist : undefined}
                      onRegenerate={() => handleRegenerateRequest(activeTab)}
                      checklistImported={activeTab === 'checklist' ? checklistImported : undefined}
                      onChecklistImported={() => setChecklistImported(true)}
                    />
                  </div>
                ) : activeTab === 'laudo' ? (
                  <div className="flex-1 flex flex-column p-6">
                    <div className="mb-6">
                      <h4 className="font-sans font-semibold text-slate-800 mb-1">Análise de Laudo Médico</h4>
                      <p className="font-sans text-sm text-slate-500">Cole o laudo abaixo para extração de patologias, limitações e enquadramento BPC.</p>
                    </div>
                    <div className="flex-1 flex flex-column gap-4">
                      <textarea
                        value={laudoText}
                        onChange={(e) => setLaudoText(e.target.value)}
                        className="flex-1 w-full neo-input bg-white border-slate-200 text-slate-800 min-h-[200px] resize-none font-sans text-sm focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] shadow-sm"
                        placeholder="Cole o texto do laudo médico aqui..."
                      />
                      <Button onClick={handleLaudoAnalysis} loading={laudoAnalyzing} disabled={!laudoText.trim()} className="self-end bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white border-0">
                        Processar Laudo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-column align-items-center justify-content-center p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-tint)] flex align-items-center justify-content-center mb-4 border border-[#F5D0C3]">
                      <span className="text-2xl">✨</span>
                    </div>
                    <h4 className="font-sans font-semibold text-slate-800 mb-2">
                      Pronto para Análise
                    </h4>
                    <p className="font-sans text-sm text-slate-500 max-w-sm mb-6">
                      Os dados estão preenchidos. Inicie a análise de <strong>{activeTabConfig.label.toLowerCase()}</strong> para obter insights e o parecer prévio.
                    </p>
                    <Button onClick={() => handleGenerate(activeTab)} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white border-0">
                      Gerar Análise
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL — CONFIRMAÇÃO DE REGENERAÇÃO */}
      <Modal open={!!confirmingTab} onClose={() => setConfirmingTab(null)} title="Regenerar análise?">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-slate-600">
            Este conteúdo já foi gerado anteriormente. Ao regenerar, o resultado atual será substituído por uma nova análise com os dados mais recentes.
          </p>
          <p className="text-xs text-slate-500">
            O histórico de análises anteriores fica salvo no prontuário do caso.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleConfirmRegenerate} className="flex-1">
              Sim, regenerar
            </Button>
            <Button variant="outline" onClick={() => setConfirmingTab(null)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

