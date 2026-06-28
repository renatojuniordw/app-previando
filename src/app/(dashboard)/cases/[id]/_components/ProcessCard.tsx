'use client'

import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { FileSearch, RefreshCw, ExternalLink } from 'lucide-react'
import type { CaseDetail } from '../_types'

interface Props {
  caseData: CaseDetail
  checking: boolean
  onCheck: () => void
  onEditClick: () => void
}

export function ProcessCard({ caseData, checking, onCheck, onEditClick }: Props) {
  const { processNumber, processLastCheck, processLastMovDate, processLastMovCount, processLastSummary } = caseData

  if (!processNumber) {
    return (
      <Card variant="light">
        <div className="p-6 flex flex-col items-center gap-3 text-center">
          <FileSearch className="w-8 h-8 text-slate-300" />
          <p className="font-sans text-sm text-slate-500">Nenhum número de processo cadastrado.</p>
          <Button variant="outline" size="sm" onClick={onEditClick}>
            Adicionar número
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="light">
      <CardHeader
        title="Acompanhamento Processual"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={onCheck}
            loading={checking}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Consultar DataJud
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Número do Processo
            </p>
            <p className="font-mono text-sm font-semibold text-slate-900">{processNumber}</p>
          </div>
          <a
            href={`https://www.cnj.jus.br/pjecnj/Processo.do?actionType=pesquisar&numeroDoProcesso=${processNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 shrink-0 mt-4"
          >
            PJe <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {processLastCheck && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Última consulta
              </p>
              <p className="font-sans text-sm text-slate-700">{formatDate(processLastCheck)}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Últ. movimentação
              </p>
              <p className="font-sans text-sm text-slate-700">
                {processLastMovDate ? formatDate(processLastMovDate) : '—'}
              </p>
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Total movimentações
              </p>
              <p className="font-sans text-sm text-slate-700">
                {processLastMovCount != null ? processLastMovCount : '—'}
              </p>
            </div>
          </div>
        )}

        {processLastSummary && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Última movimentação
            </p>
            <p className="font-sans text-sm text-slate-700">{processLastSummary}</p>
          </div>
        )}

        {!processLastCheck && (
          <p className="font-sans text-sm text-slate-400 italic">
            Ainda não consultado. Clique em &quot;Consultar DataJud&quot; para buscar as movimentações.
          </p>
        )}
      </div>
    </Card>
  )
}
