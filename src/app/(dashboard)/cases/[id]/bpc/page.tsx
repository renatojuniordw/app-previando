'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
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

  // Laudo modal
  const [showLaudoModal, setShowLaudoModal] = useState(false)
  const [laudoText, setLaudoText] = useState('')
  const [laudoAnalyzing, setLaudoAnalyzing] = useState(false)

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

  const handleGenerate = async (tab: AnalysisTab | null) => {
    if (!tab) return
    if (tab === 'laudo') {
      setShowLaudoModal(true)
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

  const handleLaudoAnalysis = async () => {
    if (!laudoText.trim()) return
    setLaudoAnalyzing(true)
    try {
      const r = await api.post(`/cases/${caseId}/bpc/laudo`, { texto: laudoText })
      setTabResults((prev) => ({ ...prev, laudo: r.data.result }))
      setActiveTab('laudo')
      if (r.data.bpcNotesCount !== undefined) setBpcNotesCount(r.data.bpcNotesCount)
      setShowLaudoModal(false)
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
  const handleExportPdf = () => {
    if (!activeResult) return
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(`<html><head><title>Análise BPC/LOAS</title>
        <style>body{font-family:monospace;padding:20px;white-space:pre-wrap;line-height:1.6;font-size:13px;}</style>
        </head><body>${activeResult.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>`)
      win.document.close()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="neo-spinner text-amber-600 mr-2" />
        <span className="font-sans text-sm text-slate-500">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-semibold text-xl text-slate-900">BPC/LOAS</h2>
          <p className="font-sans text-sm text-slate-500 mt-1">Análise técnica e documental com IA</p>
        </div>
      </div>

      {/* AVISO: prontuário com análises BPC */}
      {bpcNotesCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-500 mt-0.5 shrink-0">ℹ️</span>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm font-medium text-blue-800">
              {bpcNotesCount === 1
                ? '1 análise BPC salva no prontuário'
                : `${bpcNotesCount} análises BPC salvas no prontuário`}
            </p>
            <p className="font-sans text-xs text-blue-600 mt-0.5">
              Confira o histórico antes de gerar novamente para não consumir tokens desnecessariamente.
            </p>
          </div>
          <button
            onClick={openNotes}
            className="shrink-0 text-xs font-sans font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
          >
            Ver prontuário
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA: DADOS */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <BpcForm
            caseId={caseId}
            analysis={analysis}
            clientBirthDate={clientBirthDate}
            onSave={handleSave}
            saving={saving}
          />
        </div>

        {/* COLUNA DIREITA: INTELIGÊNCIA ARTIFICIAL */}
        <div className="lg:col-span-7">
          <Card variant="light" className="p-0 overflow-hidden flex flex-col h-full min-h-[600px]">
            {/* Cabecalho IA */}
            <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-sans font-semibold text-sm text-white flex items-center gap-2">
                <span className="text-amber-500">✦</span> Análises com IA
              </h3>
            </div>

            {/* Tabs de opções */}
            <div className="bg-slate-50 border-b border-slate-200">
              <div className="flex overflow-x-auto no-scrollbar">
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
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-sans font-medium whitespace-nowrap border-b-2 transition-all ${
                        isActive
                          ? 'border-amber-500 text-amber-700 bg-white'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isGenerating ? (
                        <span className="w-2.5 h-2.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                      ) : hasSaved ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                      )}
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Conteúdo da tab ativa */}
            <div className="flex-1 flex flex-col bg-white">
              {activeTab === 'social' ? (
                <BpcSocialInterview
                  caseId={caseId}
                  analysisExists={!!analysis}
                  relatoSocial={analysis?.relatoSocial ?? null}
                  onRelatoChange={(relato) =>
                    setAnalysis((prev) => prev ? { ...prev, relatoSocial: relato } : null)
                  }
                  onNoteSaved={setBpcNotesCount}
                />
              ) : !analysis ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-6">
                  <span className="text-4xl mb-4 grayscale opacity-50">🔒</span>
                  <h4 className="font-sans font-semibold text-slate-700 mb-1">Análises Bloqueadas</h4>
                  <p className="font-sans text-sm text-slate-500 max-w-sm">
                    Preencha e salve os dados do caso na aba ao lado para liberar as análises com Inteligência Artificial.
                  </p>
                </div>
              ) : activeResult ? (
                <BpcResult
                  caseId={caseId}
                  result={activeResult}
                  type={activeTab}
                  onCopy={handleCopy}
                  onExportPdf={handleExportPdf}
                  onOpenChecklist={activeTab === 'checklist' ? openChecklist : undefined}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-6">
                  <span className="text-3xl mb-3">
                    {generatingTab === activeTab ? '⏳' : activeTab === 'laudo' ? '📋' : '✨'}
                  </span>
                  <h4 className="font-sans font-semibold text-slate-700 mb-1">
                    {generatingTab === activeTab
                      ? 'Processando com IA...'
                      : `${activeTabConfig.label}`}
                  </h4>
                  <p className="font-sans text-sm text-slate-500 max-w-sm mb-6">
                    {generatingTab === activeTab
                      ? 'Isso pode levar alguns segundos dependendo da complexidade dos dados.'
                      : `Clique abaixo para gerar a análise focada em ${activeTabConfig.label.toLowerCase()} com base nos dados informados.`}
                  </p>

                  {generatingTab !== activeTab && activeTab !== 'laudo' && (
                    <Button onClick={() => handleGenerate(activeTab)} className="px-6">
                      Gerar Análise Agora
                    </Button>
                  )}
                  {generatingTab !== activeTab && activeTab === 'laudo' && (
                    <Button onClick={() => setShowLaudoModal(true)} className="px-6">
                      Analisar Laudo
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL — ANÁLISE DE LAUDO */}
      <Modal open={showLaudoModal} onClose={() => setShowLaudoModal(false)} title="Analisar Laudo Médico">
        <div className="space-y-4 font-sans">
          <div>
            <label className="neo-label">Cole o texto do laudo aqui</label>
            <textarea
              value={laudoText}
              onChange={(e) => setLaudoText(e.target.value)}
              className="w-full neo-input min-h-[200px] resize-none font-sans text-sm focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="Cole o texto do laudo médico aqui (não precisa formatar)..."
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleLaudoAnalysis} loading={laudoAnalyzing} disabled={!laudoText.trim()} className="flex-1">
              Analisar
            </Button>
            <Button variant="outline" onClick={() => setShowLaudoModal(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
