'use client'

import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import {
  FileSearch,
  RefreshCw,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react'
import type { CaseDetail } from '../_types'
import type { InterpretOutput } from '@/app/api/cases/[id]/process/interpret/types'
import { parseCnjNumber } from '@/lib/cnj-parser'

interface Props {
  caseData: CaseDetail
  checking: boolean
  interpreting: boolean
  interpretResult: InterpretOutput | null
  onCheck: () => void
  onInterpret: () => void
  onEditClick: () => void
}

export function ProcessCard({
  caseData,
  checking,
  interpreting,
  interpretResult,
  onCheck,
  onInterpret,
  onEditClick,
}: Props) {
  const {
    processNumber,
    processLastCheck,
    processLastMovDate,
    processLastMovCount,
    processLastSummary,
    planLimits,
  } = caseData

  if (!processNumber) {
    return (
      <Card variant="light">
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <FileSearch className="h-8 w-8 text-slate-300" />
          <p className="font-sans text-sm text-slate-500">Nenhum número de processo cadastrado.</p>
          <Button variant="outline" size="sm" onClick={onEditClick}>
            Adicionar número
          </Button>
        </div>
      </Card>
    )
  }

  const cnjInfo = processNumber ? parseCnjNumber(processNumber) : null

  return (
    <Card variant="light">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <span>Acompanhamento Processual</span>
          </div>
        }
        action={
          <Button variant="outline" size="sm" onClick={onCheck} loading={checking}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Atualizar
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Número do Processo
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-semibold text-slate-900">{processNumber}</p>
              {cnjInfo && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {cnjInfo.tribunalSigla}
                </span>
              )}
            </div>
          </div>
          <a
            href={`https://www.cnj.jus.br/pjecnj/Processo.do?actionType=pesquisar&numeroDoProcesso=${processNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex shrink-0 items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
          >
            PJe <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {processLastCheck && (
          <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-2 sm:grid-cols-3">
            <div>
              <p className="mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Última consulta
              </p>
              <p className="font-sans text-sm text-slate-700">{formatDate(processLastCheck)}</p>
            </div>
            <div>
              <p className="mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Últ. movimentação
              </p>
              <p className="font-sans text-sm text-slate-700">
                {processLastMovDate ? formatDate(processLastMovDate) : '—'}
              </p>
            </div>
            <div>
              <p className="mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total movimentações
              </p>
              <p className="font-sans text-sm text-slate-700">
                {processLastMovCount != null ? processLastMovCount : '—'}
              </p>
            </div>
          </div>
        )}

        {processLastSummary && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Última movimentação
            </p>
            <p className="font-sans text-sm text-slate-700">{processLastSummary}</p>

            {planLimits?.processInterpretEnabled && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onInterpret}
                  loading={interpreting}
                  disabled={interpreting}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                  Interpretar com IA
                </Button>
              </div>
            )}

            {interpretResult && (
              <div className="mt-3 rounded-lg border bg-white p-3">
                <div className="flex items-start gap-2">
                  {interpretResult.urgency === 'CRITICAL' && (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  )}
                  {interpretResult.urgency === 'ACTION_REQUIRED' && (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  )}
                  {interpretResult.urgency === 'INFORMATIVE' && (
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          interpretResult.urgency === 'CRITICAL'
                            ? 'bg-red-50 text-red-700'
                            : interpretResult.urgency === 'ACTION_REQUIRED'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {interpretResult.urgencyLabel}
                      </span>
                    </div>
                    <p className="font-sans text-sm text-slate-700">
                      {interpretResult.interpretation}
                    </p>
                    {interpretResult.suggestedAction && (
                      <p className="font-sans text-xs italic text-slate-500">
                        {interpretResult.suggestedAction}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!processLastCheck && (
          <p className="font-sans text-sm italic text-slate-400">
            Nenhuma consulta realizada ainda.
          </p>
        )}
      </div>
    </Card>
  )
}
