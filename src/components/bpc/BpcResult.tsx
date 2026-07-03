'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import dynamic from 'next/dynamic'
import api from '@/lib/api'
import { BpcPDFDocument } from '@/components/pdf/BpcPDFDocument'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(m => ({ default: m.PDFDownloadLink })),
  { ssr: false, loading: () => <span className="text-xs text-slate-400">Carregando...</span> }
)

type AnalysisType = 'preAnalise' | 'laudo' | 'social' | 'medical' | 'checklist' | null

interface BpcResultProps {
  caseId: string
  result: string
  type: AnalysisType
  onCopy: () => void
  onOpenChecklist?: () => void
  onRegenerate?: () => void
  checklistImported?: boolean
  onChecklistImported?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  preAnalise: 'Pré-Análise de Viabilidade',
  laudo: 'Análise de Laudo',
  social: 'Perguntas — Avaliação Social',
  medical: 'Perguntas — Perícia Médica',
  checklist: 'Checklist de Documentação',
}

function parseChecklistMarkdown(text: string): {
  items: { id: string; label: string; checked: boolean; required: boolean }[]
  pendencias: string[]
} {
  const items: { id: string; label: string; checked: boolean; required: boolean }[] = []
  const pendencias: string[] = []
  let currentSection = ''

  for (const line of text.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.match(/^#{1,4}\s+/)) {
      const heading = trimmed.replace(/^#{1,4}\s+\d*\.?\s*/, '').toLowerCase()
      if (heading.includes('obrigat')) currentSection = 'required'
      else if (heading.includes('recomend') || heading.includes('opcional')) currentSection = 'optional'
      else if (heading.includes('incompleto') || heading.includes('pendente')) currentSection = 'pendencias'
      else currentSection = 'skip'
      continue
    }

    if (currentSection === 'skip') continue

    const match = trimmed.match(/^[-*•]\s+\*{0,2}(.+?)\*{0,2}$/)
    if (!match) continue

    const label = match[1].replace(/\*\*/g, '').trim()
    if (label.length < 3 || label.length > 300) continue

    if (currentSection === 'pendencias') {
      pendencias.push(label)
    } else {
      items.push({
        id: `bpc-${items.length}-${Math.random().toString(36).slice(2, 9)}`,
        label,
        checked: false,
        required: currentSection === 'required',
      })
    }
  }

  return { items, pendencias }
}

export function BpcResult({ caseId, result, type, onCopy, onOpenChecklist, onRegenerate, checklistImported, onChecklistImported }: BpcResultProps) {
  const [importing, setImporting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleImportChecklist = async () => {
    const { items, pendencias } = parseChecklistMarkdown(result)
    if (items.length === 0) return
    setImporting(true)
    try {
      await api.post(`/cases/${caseId}/checklist`, {
        items,
        eligible: true,
        pendencias,
      })
      onChecklistImported?.()
      onOpenChecklist?.()
    } catch {
      // noop
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card variant="light" className="p-0 overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-400">
            RESULTADO
          </span>
          {type && (
            <Badge variant="blue">{TYPE_LABELS[type] ?? type}</Badge>
          )}
        </div>
      </div>

      <div className="p-6 prose prose-sm prose-slate max-w-none
        prose-headings:font-sans prose-headings:font-semibold prose-headings:text-slate-800 prose-headings:mt-4 prose-headings:mb-2
        prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
        prose-p:text-slate-700 prose-p:leading-relaxed prose-p:my-1.5
        prose-li:text-slate-700 prose-li:my-0.5
        prose-strong:text-slate-800 prose-strong:font-semibold
        prose-ul:my-2 prose-ol:my-2
        prose-hr:border-slate-200">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-wrap gap-3">
        <Button variant="outline" onClick={onCopy} className="text-xs py-2">
          📋 Copiar
        </Button>
        {mounted && (
          <PDFDownloadLink
            document={<BpcPDFDocument result={result} type={type ? TYPE_LABELS[type] || 'BPC/LOAS' : 'BPC/LOAS'} />}
            fileName={`previando-bpc-${caseId}.pdf`}
            className="inline-flex items-center justify-center px-3 py-2 text-xs border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            📄 Exportar PDF
          </PDFDownloadLink>
        )}
        {onRegenerate && (
          <Button variant="outline" onClick={onRegenerate} className="text-xs py-2 border-slate-300 text-slate-600 hover:bg-slate-100">
            🔄 Regenerar
          </Button>
        )}
        {type === 'checklist' && (
          <Button
            variant="outline"
            onClick={handleImportChecklist}
            loading={importing}
            disabled={!!checklistImported}
            className="text-xs py-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {checklistImported ? '✅ Importado' : '✅ Importar para Checklist'}
          </Button>
        )}
      </div>

      <div className="border-t border-slate-100 px-6 py-2.5 flex items-center gap-1.5">
        <span className="text-amber-500 text-xs">⚠</span>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Gerado por IA — não substitui análise jurídica profissional. Responsabilidade exclusiva do advogado.
        </p>
      </div>
    </Card>
  )
}
