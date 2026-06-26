'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

import { BpcForm } from '@/components/bpc/BpcForm'
import { BpcResult } from '@/components/bpc/BpcResult'
import { BpcSocialInterview } from '@/components/bpc/BpcSocialInterview'
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

  const handleCopy = () => { if (activeResult) navigator.clipboard.writeText(activeResult) }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="neo-spinner text-amber-600 mr-2" />
        <span className="font-sans text-sm text-slate-500">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="font-serif font-semibold text-2xl text-slate-900 tracking-tight">BPC/LOAS</h2>
          <p className="font-sans text-sm text-slate-500 mt-1">Análise técnica e documental com Inteligência Artificial</p>
        </div>
        
        {/* AVISO: prontuário com análises BPC movido para o header */}
        {bpcNotesCount > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 text-slate-200 px-3 py-1.5 rounded-full text-xs font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {bpcNotesCount} {bpcNotesCount === 1 ? 'registro no prontuário' : 'registros no prontuário'}
            <button
              onClick={openNotes}
              className="ml-2 pl-2 border-l border-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
            >
              Visualizar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUNA ESQUERDA: DADOS (33%) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
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
          <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-full min-h-[650px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {/* Header IA Command Center */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
                <h3 className="font-sans text-sm font-semibold text-slate-700 ml-2">
                  BPC Inteligência Artificial
                </h3>
              </div>
              {generatingTab && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  <span className="text-xs font-mono text-amber-500/80">PROCESSANDO</span>
                </div>
              )}
            </div>

            {/* Layout Interno do Command Center (Tabs na lateral vs Topo) */}
            <div className="flex flex-col md:flex-row flex-1">
              {/* Tabs / Menu Esquerdo do Command Center */}
              <div className="w-full md:w-48 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 p-3">
                <div className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
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
                        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-md text-xs font-sans font-medium transition-all text-left whitespace-nowrap ${
                          isActive
                            ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-transparent'
                        }`}
                      >
                        <span className="truncate">{tab.label}</span>
                        {isGenerating ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-2 shrink-0" />
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
              <div className="flex-1 flex flex-col bg-white relative">
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
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                      <span className="text-2xl grayscale opacity-40">🔒</span>
                    </div>
                    <h4 className="font-sans font-semibold text-slate-800 mb-2">Sistema Bloqueado</h4>
                    <p className="font-sans text-sm text-slate-500 max-w-sm">
                      Preencha e salve os dados fundamentais na coluna lateral para iniciar as análises de inteligência artificial.
                    </p>
                  </div>
                ) : generatingTab === activeTab ? (
                  <div className="flex-1 flex flex-col p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-mono text-amber-500">GERANDO ANÁLISE...</span>
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
                    />
                  </div>
                ) : activeTab === 'laudo' ? (
                  <div className="flex-1 flex flex-col p-6">
                    <div className="mb-6">
                      <h4 className="font-sans font-semibold text-slate-800 mb-1">Análise de Laudo Médico</h4>
                      <p className="font-sans text-sm text-slate-500">Cole o laudo abaixo para extração de patologias, limitações e enquadramento BPC.</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-4">
                      <textarea
                        value={laudoText}
                        onChange={(e) => setLaudoText(e.target.value)}
                        className="flex-1 w-full neo-input bg-white border-slate-200 text-slate-800 min-h-[200px] resize-none font-sans text-sm focus:ring-amber-500/20 focus:border-amber-500 shadow-sm"
                        placeholder="Cole o texto do laudo médico aqui..."
                      />
                      <Button onClick={handleLaudoAnalysis} loading={laudoAnalyzing} disabled={!laudoText.trim()} className="self-end bg-amber-600 hover:bg-amber-700 text-white border-0">
                        Processar Laudo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 border border-amber-100">
                      <span className="text-2xl">✨</span>
                    </div>
                    <h4 className="font-sans font-semibold text-slate-800 mb-2">
                      Pronto para Análise
                    </h4>
                    <p className="font-sans text-sm text-slate-500 max-w-sm mb-6">
                      Os dados estão preenchidos. Inicie a análise de <strong>{activeTabConfig.label.toLowerCase()}</strong> para obter insights e o parecer prévio.
                    </p>
                    <Button onClick={() => handleGenerate(activeTab)} className="bg-amber-600 hover:bg-amber-700 text-white border-0">
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

