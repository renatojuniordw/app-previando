'use client'

import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import {
  FileSearch,
  RefreshCw,
  ExternalLink,
  Shield,
  ShieldOff,
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

export function ProcessCard({ caseData, checking, interpreting, interpretResult, onCheck, onInterpret, onEditClick }: Props) {
  const {
    processNumber,
    processLastCheck,
    processLastMovDate,
    processLastMovCount,
    processLastSummary,
    trackjudMonitorId,
    planLimits,
  } = caseData

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

  const hasMonitor = !!trackjudMonitorId
  const cnjInfo = processNumber ? parseCnjNumber(processNumber) : null

  return (
    <Card variant="light">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <span>Acompanhamento Processual</span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                hasMonitor
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {hasMonitor ? (
                <>
                  <Shield className="w-2.5 h-2.5" />
                  Monitoramento ativo
                </>
              ) : (
                <>
                  <ShieldOff className="w-2.5 h-2.5" />
                  Não monitorado
                </>
              )}
            </span>
          </div>
        }
        action={
          hasMonitor && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCheck}
              loading={checking}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Atualizar agora
            </Button>
          )
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Número do Processo
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-mono text-sm font-semibold text-slate-900">{processNumber}</p>
              {cnjInfo && (
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {cnjInfo.tribunalSigla}
                </span>
              )}
            </div>
          </div>
          <a
            href={`https://www.cnj.jus.br/pjecnj/Processo.do?actionType=pesquisar&numeroDoProcesso=${processNumber.replace(/\\D/g, '')}`}
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

            {planLimits?.processInterpretEnabled && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onInterpret}
                  loading={interpreting}
                  disabled={interpreting}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  Interpretar com IA
                </Button>
              </div>
            )}

            {interpretResult && (
              <div className="mt-3 p-3 rounded-lg border bg-white">
                <div className="flex items-start gap-2">
                  {interpretResult.urgency === 'CRITICAL' && (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  {interpretResult.urgency === 'ACTION_REQUIRED' && (
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  {interpretResult.urgency === 'INFORMATIVE' && (
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
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
                    <p className="font-sans text-sm text-slate-700">{interpretResult.interpretation}</p>
                    {interpretResult.suggestedAction && (
                      <p className="font-sans text-xs text-slate-500 italic">
                        💡 {interpretResult.suggestedAction}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!processLastCheck && (
          <p className="font-sans text-sm text-slate-400 italic">
            {hasMonitor
              ? 'Aguardando primeira movimentação do TrackJud ou clique em Atualizar.'
              : 'Aguardando registro do monitoramento no TrackJud.'}
          </p>
        )}
      </div>
    </Card>
  )
}
