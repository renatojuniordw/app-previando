'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BpcForm } from '@/components/bpc/BpcForm'
import { BpcAnalysisButtons } from '@/components/bpc/BpcAnalysisButtons'
import { BpcResult } from '@/components/bpc/BpcResult'

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
}

type AnalysisType = 'preAnalise' | 'laudo' | 'social' | 'medical' | 'checklist' | null

export default function BpcPage() {
  const params = useParams()
  const caseId = params.id as string

  const [analysis, setAnalysis] = useState<BpcAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType>(null)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // Laudo modal state
  const [showLaudoModal, setShowLaudoModal] = useState(false)
  const [laudoText, setLaudoText] = useState('')
  const [laudoAnalyzing, setLaudoAnalyzing] = useState(false)

  const load = useCallback(() => {
    api.get(`/cases/${caseId}/bpc`)
      .then((r) => setAnalysis(r.data))
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false))
  }, [caseId])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: any) => {
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

  const handleAnalysis = async (type: AnalysisType) => {
    if (!type) return
    setAnalysisLoading(true)
    setActiveAnalysis(type)

    try {
      let endpoint = ''
      let body: any = {}

      switch (type) {
        case 'preAnalise':
          endpoint = `/cases/${caseId}/bpc/pre-analysis`
          break
        case 'social':
          endpoint = `/cases/${caseId}/bpc/social`
          break
        case 'medical':
          endpoint = `/cases/${caseId}/bpc/medical`
          break
        case 'checklist':
          endpoint = `/cases/${caseId}/bpc/checklist`
          break
        default:
          return
      }

      const r = await api.post(endpoint, body)
      setAnalysisResult(r.data.result)
    } catch {
      // error handled by api interceptor
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleLaudoAnalysis = async () => {
    if (!laudoText.trim()) return
    setLaudoAnalyzing(true)
    try {
      const r = await api.post(`/cases/${caseId}/bpc/laudo`, { texto: laudoText })
      setAnalysisResult(r.data.result)
      setActiveAnalysis('laudo')
      setShowLaudoModal(false)
      setLaudoText('')
    } catch {
      // error handled by api interceptor
    } finally {
      setLaudoAnalyzing(false)
    }
  }

  const handleCopy = () => {
    if (analysisResult) navigator.clipboard.writeText(analysisResult)
  }

  const handleExportPdf = () => {
    if (!analysisResult) return
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(`
        <html><head><title>Análise BPC/LOAS</title>
        <style>body{font-family:monospace;padding:20px;white-space:pre-wrap;line-height:1.6;font-size:13px;}</style>
        </head><body>${analysisResult.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>
      `)
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
    <div className="space-y-6 max-w-4xl font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-semibold text-xl text-slate-900">BPC/LOAS</h2>
          <p className="font-sans text-sm text-slate-500 mt-1">Análise técnica e documental com IA</p>
        </div>
      </div>

      {/* BLOCO 1 — DADOS DO CASO */}
      <BpcForm analysis={analysis} onSave={handleSave} saving={saving} />

      {/* BLOCO 2 — ANÁLISES COM IA */}
      <BpcAnalysisButtons
        onAnalyze={handleAnalysis}
        onOpenLaudo={() => setShowLaudoModal(true)}
        loading={analysisLoading}
        disabled={!analysis}
      />

      {/* BLOCO 3 — RESULTADO */}
      {analysisResult && (
        <BpcResult
          result={analysisResult}
          type={activeAnalysis}
          onCopy={handleCopy}
          onExportPdf={handleExportPdf}
        />
      )}

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
            <Button
              onClick={handleLaudoAnalysis}
              loading={laudoAnalyzing}
              disabled={!laudoText.trim()}
              className="flex-1"
            >
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
