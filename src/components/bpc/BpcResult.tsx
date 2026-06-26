'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import api from '@/lib/api'

type AnalysisType = 'preAnalise' | 'laudo' | 'social' | 'medical' | 'checklist' | null

interface BpcResultProps {
  caseId: string
  result: string
  type: AnalysisType
  onCopy: () => void
  onExportPdf: () => void
  onOpenChecklist?: () => void
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
        id: `bpc-${Date.now()}-${items.length}`,
        label,
        checked: false,
        required: currentSection === 'required',
      })
    }
  }

  return { items, pendencias }
}

export function BpcResult({ caseId, result, type, onCopy, onExportPdf, onOpenChecklist }: BpcResultProps) {
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)

  const handleImportChecklist = async () => {
    const { items, pendencias } = parseChecklistMarkdown(result)
    if (items.length === 0) return
    setImporting(true)
    try {
      await api.post(`/cases/${caseId}/checklist`, {
        benefitType: 'BPC_LOAS',
        items,
        eligible: true,
        pendencias,
      })
      setImportDone(true)
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

      <div className="p-6">
        <p className="font-sans text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {result}
        </p>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-wrap gap-3">
        <Button variant="outline" onClick={onCopy} className="text-xs py-2">
          📋 Copiar
        </Button>
        <Button variant="outline" onClick={onExportPdf} className="text-xs py-2">
          📄 Exportar PDF
        </Button>
        {type === 'checklist' && (
          <Button
            variant="outline"
            onClick={handleImportChecklist}
            loading={importing}
            disabled={importDone}
            className="text-xs py-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {importDone ? '✅ Importado' : '✅ Importar para Checklist'}
          </Button>
        )}
      </div>

      <div className="border-t border-amber-200 bg-amber-50 px-6 py-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">
          ⚠️ AVISO IMPORTANTE
        </p>
        <p className="text-xs font-mono font-bold uppercase text-amber-600 tracking-widest leading-relaxed">
          Este conteúdo é gerado por inteligência artificial com base nas informações fornecidas.
          Não substitui análise jurídica profissional. A responsabilidade pela estratégia
          processual é exclusivamente do advogado responsável pelo caso.
          Previando é um produto Unificando.
        </p>
      </div>
    </Card>
  )
}
