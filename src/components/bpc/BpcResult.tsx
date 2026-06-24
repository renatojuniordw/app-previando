'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type AnalysisType = 'preAnalise' | 'laudo' | 'social' | 'medical' | 'checklist' | null

interface BpcResultProps {
  result: string
  type: AnalysisType
  onCopy: () => void
  onExportPdf: () => void
}

const TYPE_LABELS: Record<string, string> = {
  preAnalise: 'Pré-Análise de Viabilidade',
  laudo: 'Análise de Laudo',
  social: 'Perguntas — Avaliação Social',
  medical: 'Perguntas — Perícia Médica',
  checklist: 'Checklist de Documentação',
}

export function BpcResult({ result, type, onCopy, onExportPdf }: BpcResultProps) {
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

      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex gap-3">
        <Button variant="outline" onClick={onCopy} className="flex-1 text-xs py-2">
          📋 Copiar
        </Button>
        <Button variant="outline" onClick={onExportPdf} className="flex-1 text-xs py-2">
          📄 Exportar PDF
        </Button>
      </div>

      {/* AVISO LEGAL OBRIGATÓRIO */}
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
