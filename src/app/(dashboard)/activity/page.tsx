'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/store/toast'
import { Activity, ChevronDown, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityLog {
  id: string
  action: string
  label: string
  resource: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

const ACTION_COLOR: Record<string, string> = {
  'case.created': 'bg-blue-50 text-blue-700 border-blue-150',
  'case.updated': 'bg-sky-50 text-sky-700 border-sky-150',
  'case.status.changed': 'bg-emerald-50 text-emerald-700 border-emerald-150',
  'case.deleted': 'bg-red-50 text-red-700 border-red-150',
  'cnis.upload': 'bg-cyan-50 text-cyan-700 border-cyan-150',
  'cnis.processed': 'bg-green-50 text-green-700 border-green-150',
  'cnis.failed': 'bg-orange-50 text-orange-700 border-orange-150',
  'calculation.created': 'bg-amber-50 text-amber-700 border-amber-150',
  'calculation.selected': 'bg-yellow-50 text-yellow-700 border-yellow-150',
  'simulation.created': 'bg-lime-50 text-lime-700 border-lime-150',
  'retroative.created': 'bg-emerald-50 text-emerald-700 border-emerald-150',
  'retroactive.calculated': 'bg-emerald-50 text-emerald-700 border-emerald-150',
  'opinion.created': 'bg-rose-50 text-rose-700 border-rose-150',
  'note.created': 'bg-slate-50 text-slate-655 border-slate-200',
  'bpc.laudo': 'bg-orange-50 text-orange-700 border-orange-150',
  'bpc.pre-analysis': 'bg-amber-50 text-amber-700 border-amber-150',
  'client.created': 'bg-teal-50 text-teal-700 border-teal-150',
  'client.updated': 'bg-cyan-50 text-cyan-700 border-cyan-150',
  'client.deleted': 'bg-red-50 text-red-700 border-red-150',
  'export.pdf': 'bg-slate-50 text-slate-655 border-slate-200',
  'pdf.processed': 'bg-slate-50 text-slate-655 border-slate-200',
}

const DOT_COLOR: Record<string, string> = {
  'case.created': 'bg-blue-500',
  'case.updated': 'bg-sky-500',
  'case.status.changed': 'bg-emerald-500',
  'case.deleted': 'bg-red-500',
  'cnis.upload': 'bg-cyan-500',
  'cnis.processed': 'bg-green-500',
  'cnis.failed': 'bg-orange-500',
  'calculation.created': 'bg-amber-500',
  'calculation.selected': 'bg-yellow-500',
  'simulation.created': 'bg-lime-500',
  'retroative.created': 'bg-emerald-500',
  'retroactive.calculated': 'bg-emerald-500',
  'opinion.created': 'bg-rose-500',
  'note.created': 'bg-slate-500',
  'bpc.laudo': 'bg-orange-500',
  'bpc.pre-analysis': 'bg-amber-500',
  'client.created': 'bg-teal-500',
  'client.updated': 'bg-cyan-500',
  'client.deleted': 'bg-red-500',
  'export.pdf': 'bg-slate-500',
  'pdf.processed': 'bg-slate-500',
}

function formatMetadata(action: string, metadata: Record<string, unknown> | null): string {
  if (!metadata) return ''

  const entries: string[] = []

  if (action === 'case.status.changed' && typeof metadata.novoStatus === 'string') {
    const statusMap: Record<string, string> = {
      'PROSPECTING': 'Prospecção',
      'PROSPECCAO': 'Prospecção',
      'ANALYSIS': 'Análise',
      'ANALISE': 'Análise',
      'PRONTO_PARA_REQUERER': 'Pronto para Requerer',
      'EM_PROCESSAMENTO': 'Em Processamento',
      'FINALIZADO': 'Finalizado',
    }
    const cleanStatus = statusMap[metadata.novoStatus] ?? metadata.novoStatus
    entries.push(`Novo Status: ${cleanStatus}`)
  }

  if (action === 'cnis.upload') {
    if (typeof metadata.fileName === 'string') {
      entries.push(`Arquivo: ${metadata.fileName}`)
    }
    if (typeof metadata.fileSize === 'number') {
      const kb = (metadata.fileSize / 1024).toFixed(1)
      entries.push(`Tamanho: ${kb} KB`)
    }
  }

  if (action === 'cnis.processed') {
    entries.push(metadata.isProgrammatic ? 'Método: Instantâneo' : 'Método: IA')
  }

  if (action === 'cnis.failed' && typeof metadata.error === 'string') {
    entries.push(`Motivo: ${metadata.error}`)
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (
      [
        'caseId',
        'clientId',
        'calculationId',
        'opinionId',
        'noteId',
        'retroactiveId',
        'simulationId',
        'cnisDocumentId',
        'novoStatus',
        'fileName',
        'fileSize',
        'isProgrammatic',
        'error',
      ].includes(key)
    ) {
      continue
    }
    entries.push(`${key}: ${String(value)}`)
  }

  return entries.join(' · ')
}

function relativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'agora'
  if (diffMin < 60) return `há ${diffMin}min`
  if (diffHr < 24) return `há ${diffHr}h`
  if (diffDay === 1) return 'ontem'
  if (diffDay < 7) return `há ${diffDay} dias`
  return format(date, "dd 'de' MMMM", { locale: ptBR })
}

function dayLabel(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  return format(date, "dd 'de' MMMM", { locale: ptBR })
}

function groupByDay(logs: ActivityLog[]): [string, ActivityLog[]][] {
  const groups: Record<string, ActivityLog[]> = {}
  for (const log of logs) {
    const key = new Date(log.createdAt).toISOString().split('T')[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(log)
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const limit = 25
  const { addToast } = useToast()

  const fetchLogs = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const res = await api.get(`/activity?page=${pageNum}&limit=${limit}`)
      setLogs((prev) => (append ? [...prev, ...res.data.logs] : res.data.logs))
      setTotal(res.data.total)
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar atividades.' })
    }
    setLoading(false)
    setLoadingMore(false)
  }, [addToast])

  useEffect(() => { fetchLogs(1) }, [fetchLogs])

  const hasMore = page * limit < total
  const groups = groupByDay(logs)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
          <Activity className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Log de Atividades</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">Histórico completo de auditoria das ações realizadas pelos operadores no sistema.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
          <p className="font-sans font-medium text-slate-500 mt-4 animate-pulse">Carregando logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-200 text-slate-350">
            <Activity className="w-8 h-8" />
          </div>
          <p className="font-serif font-bold text-slate-900 text-lg">Nenhuma atividade</p>
          <p className="font-sans text-slate-500 text-sm mt-1 max-w-sm font-medium">
            As ações dos operadores do sistema serão exibidas aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map(([dateKey, dayLogs]) => (
            <div key={dateKey} className="space-y-4">
              {/* Sticky day header */}
              <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm py-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                <span className="font-sans text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em]">
                  {dayLabel(dateKey)}
                </span>
              </div>

              {/* Timeline */}
              <div className="relative pl-8 sm:pl-10">
                {/* Vertical line */}
                <div className="absolute left-[11px] sm:left-[15px] top-0 bottom-0 w-[2px] bg-slate-200/80" />

                <div className="space-y-5">
                  {dayLogs.map((log) => {
                    const metaStr = formatMetadata(log.action, log.metadata as Record<string, unknown>)
                    const dotClass = DOT_COLOR[log.action] ?? 'bg-slate-500'
                    const badgeClass = ACTION_COLOR[log.action] ?? 'bg-slate-50 text-slate-655 border-slate-200'

                    return (
                      <div key={log.id} className="relative">
                        {/* Timeline dot */}
                        <div className={cn(
                          'absolute -left-[25px] sm:-left-[31px] top-2.5 w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] rounded-full border-2 border-white shadow-sm flex items-center justify-center z-[5]',
                          dotClass.replace('bg-', 'bg-').replace(/(bg-\w+-)\d+/, '$1') + ' bg-opacity-20'
                        )}>
                          <div className={cn('w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full', dotClass)} />
                        </div>

                        {/* Content card */}
                        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-300">
                          <div className="flex items-start gap-2 sm:gap-3 mb-1.5">
                            <span className={cn(
                              'inline-flex items-center justify-center px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider text-center shrink-0',
                              badgeClass
                            )}>
                              {log.label}
                            </span>
                            <span className="font-sans text-[11px] text-slate-400 font-medium mt-0.5 shrink-0 ml-auto">
                              {relativeTime(log.createdAt)}
                            </span>
                          </div>

                          <p className="font-sans text-sm text-slate-800 font-bold leading-snug">
                            {log.resource}
                          </p>

                          {metaStr && (
                            <p className="font-sans text-xs text-slate-500 font-medium leading-relaxed mt-1 break-words">
                              {metaStr}
                            </p>
                          )}

                          <p className="font-mono text-[10px] text-slate-300 font-medium mt-1.5">
                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Carregar mais */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={() => {
                  const nextPage = page + 1
                  setPage(nextPage)
                  fetchLogs(nextPage, true)
                }}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 hover:text-slate-850 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-sans font-bold text-xs text-slate-700 uppercase tracking-wider"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}

          {/* Total count */}
          {total > 0 && (
            <div className="text-center pb-4">
              <span className="font-sans text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {logs.length} de {total} registros carregados
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
