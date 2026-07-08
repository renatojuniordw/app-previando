'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { downloadReactPdf } from '@/lib/download-pdf'
import { useUpgradeModal } from '@/store/upgrade-modal'
import { Copy, FileText, RefreshCw, Check, AlertTriangle, Lock } from 'lucide-react'

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
  /** Plano sem EXPORT_PDF: botão mostra cadeado e abre o modal de upgrade. */
  exportPdfLocked?: boolean
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

export function BpcResult({ caseId, result, type, onCopy, onOpenChecklist, onRegenerate, checklistImported, onChecklistImported, exportPdfLocked }: BpcResultProps) {
  const addToast = useToast((s) => s.addToast)
  const openUpgradeModal = useUpgradeModal((s) => s.openModal)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
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
      addToast({
        type: 'success',
        title: 'checklist importado',
        message: 'os itens de documentação recomendados foram importados para o checklist do caso.'
      })
    } catch {
      addToast({
        type: 'error',
        title: 'erro ao importar',
        message: 'não foi possível importar os itens do checklist.'
      })
    } finally {
      setImporting(false)
    }
  }

  const handleCopyAction = () => {
    onCopy()
    addToast({
      type: 'success',
      title: 'copiado',
      message: 'o conteúdo da análise foi copiado para a área de transferência.'
    })
  }

  return (
    <Card variant="light" className="p-0 overflow-hidden border-slate-200/80 shadow-sm">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-400">
            RESULTADO
          </span>
          {type && (
            <Badge variant="blue" className="text-[10px] font-bold">{TYPE_LABELS[type] ?? type}</Badge>
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
        <Button variant="outline" onClick={handleCopyAction} className="text-xs py-2 flex items-center gap-1.5">
          <Copy className="w-3.5 h-3.5 text-slate-500" />
          Copiar
        </Button>
        {mounted && (
          <Button
            variant="outline"
            onClick={() => {
              if (exportPdfLocked) {
                openUpgradeModal({ message: '', feature: 'EXPORT_PDF', upgradeRequired: 'SOLO' })
                return
              }
              setExporting(true)
            downloadReactPdf(
              { result, type: type ? TYPE_LABELS[type] || 'BPC/LOAS' : 'BPC/LOAS', caseId },
              `previando-bpc-${caseId}.pdf`
              ).then((ok) => {
                setExporting(false)
                if (!ok) addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })
              })
            }}
            loading={exporting}
            className="text-xs py-2 flex items-center gap-1.5"
          >
            {exportPdfLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <FileText className="w-3.5 h-3.5 text-slate-500" />}
            Exportar PDF
          </Button>
        )}
        {onRegenerate && (
          <Button variant="outline" onClick={onRegenerate} className="text-xs py-2 border-slate-350 text-slate-655 hover:bg-slate-100 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Regenerar
          </Button>
        )}
        {type === 'checklist' && (
          <Button
            variant="outline"
            onClick={handleImportChecklist}
            loading={importing}
            disabled={!!checklistImported}
            className="text-xs py-2 border-emerald-250 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            {checklistImported ? 'Importado' : 'Importar para Checklist'}
          </Button>
        )}
      </div>

      <div className="border-t border-slate-100 px-6 py-2.5 flex items-center gap-2 bg-amber-50/20">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <p className="text-[11px] text-slate-450 leading-relaxed">
          Gerado por IA — não substitui análise jurídica profissional. Responsabilidade exclusiva do advogado.
        </p>
      </div>
    </Card>
  )
}
