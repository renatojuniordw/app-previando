'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/store/toast'
import { Activity, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 25
  const { addToast } = useToast()

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/activity?page=${page}&limit=${limit}`)
      setLogs(res.data.logs)
      setTotal(res.data.total)
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar atividades.' })
    }
    setLoading(false)
  }, [page, addToast])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">
      
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

      <Card variant="light" className="p-0 overflow-hidden border-slate-200/80 shadow-sm">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4.5 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider w-48">Evento</th>
                  <th className="px-6 py-4.5 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Detalhamento</th>
                  <th className="px-6 py-4.5 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider text-right w-52">Data / Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((log) => {
                  const metaStr = formatMetadata(log.action, log.metadata as Record<string, unknown>)
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center justify-center px-2.5 py-1 rounded-md border text-[9px] font-extrabold uppercase tracking-wider min-w-[140px] text-center",
                          ACTION_COLOR[log.action] ?? 'bg-slate-50 text-slate-655 border-slate-200'
                        )}>
                          {log.label}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="space-y-1">
                          <p className="text-sm text-slate-800 font-bold leading-snug">{log.resource}</p>
                          {metaStr && (
                            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl break-all">
                              {metaStr}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-right whitespace-nowrap">
                        <span className="text-xs text-slate-400 font-mono font-medium">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4.5 border-t border-slate-100 flex items-center justify-between bg-white">
            <span className="text-xs text-slate-550 font-medium">{total} registros no total</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 hover:text-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="text-xs text-slate-700 font-bold font-mono bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 hover:text-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                aria-label="Próxima página"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
