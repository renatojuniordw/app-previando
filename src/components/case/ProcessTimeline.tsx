'use client'

import { useState } from 'react'
import {
  Gavel,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { useToast } from '@/store/toast'

interface ProcessMovement {
  date: string
  description: string
  type?: string
  highlight?: boolean
}

interface ProcessTimelineProps {
  caseId: string
  processNumber?: string | null
  lastCheck?: string | null
  lastMovDate?: string | null
  lastMovCount?: number | null
  lastSummary?: string | null
  onRefresh: () => void
}

export function ProcessTimeline({
  caseId,
  processNumber,
  lastCheck,
  lastMovDate,
  lastMovCount,
  lastSummary,
  onRefresh,
}: ProcessTimelineProps) {
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const { addToast } = useToast()

  // Simulated movements from last summary
  const movements: ProcessMovement[] = lastSummary
    ? [
        {
          date: lastMovDate ?? '—',
          description: lastSummary,
          type: 'movement',
          highlight: true,
        },
      ]
    : []

  const hasMovements = movements.length > 0
  const newMovements = lastMovCount && lastMovCount > 0 ? lastMovCount : 0

  const handleRefresh = async () => {
    if (!processNumber) return
    setLoading(true)
    try {
      await api.post(`/cases/${caseId}/process`)
      addToast({
        type: 'success',
        title: 'Processo consultado',
        message: 'Dados atualizados com sucesso.',
      })
      onRefresh()
    } catch {
      addToast({
        type: 'error',
        title: 'Erro na consulta',
        message: 'Não foi possível consultar o processo.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!processNumber) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Gavel className="w-5 h-5 text-slate-400" aria-hidden="true" />
          <h3 className="font-serif font-bold text-lg text-slate-900">Processo Judicial</h3>
        </div>
        <p className="font-sans text-sm text-slate-500">
          Nenhum número de processo cadastrado. Informe o número CNJ na aba de informações do caso para acompanhar.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Processo Judicial</h3>
              <p className="font-mono text-xs text-slate-500 mt-0.5">{processNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {newMovements > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 font-sans font-bold text-[10px] uppercase rounded-full bg-green-100 text-green-700">
                {newMovements} novo{newMovements !== 1 ? 's' : ''}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              loading={loading}
              aria-label="Consultar processo novamente"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline ml-1">Consultar</span>
            </Button>
          </div>
        </div>

        {lastCheck && (
          <p className="font-sans text-xs text-slate-400 mt-2">
            Última consulta: {formatDate(lastCheck)}
          </p>
        )}
      </div>

      {/* Movements */}
      {hasMovements && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            aria-expanded={expanded}
          >
            <span className="font-sans text-sm font-semibold text-slate-700">
              Movimentações ({movements.length})
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
            )}
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3">
              {movements.map((mov, i) => (
                <div
                  key={i}
                  className={`relative pl-6 pb-3 ${
                    i < movements.length - 1 ? 'border-l-2 border-amber-200' : ''
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span className="font-sans text-xs font-medium text-slate-500">
                        {formatDate(mov.date)}
                      </span>
                      {mov.highlight && (
                        <span className="inline-flex items-center px-1.5 py-0.5 font-sans font-bold text-[10px] uppercase rounded bg-amber-100 text-amber-700">
                          Novo
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-sm text-slate-700 leading-relaxed">
                      {mov.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* No movements */}
      {!hasMovements && (
        <div className="p-4">
          <p className="font-sans text-sm text-slate-500">
            Nenhuma movimentação encontrada. Clique em &quot;Consultar&quot; para buscar os dados do processo.
          </p>
        </div>
      )}

      {/* Alert */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="font-sans text-xs text-slate-500">
          As informações são atualizadas manualmente. Consulte o tribunal para dados oficiais.
        </p>
      </div>
    </div>
  )
}
