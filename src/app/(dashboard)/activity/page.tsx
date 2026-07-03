'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/store/toast'
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'

interface ActivityLog {
  id: string
  action: string
  label: string
  resource: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

const ACTION_COLOR: Record<string, string> = {
  'case.created': 'bg-blue-50 text-blue-700 border border-blue-100',
  'case.updated': 'bg-sky-50 text-sky-700 border border-sky-100',
  'case.status.changed': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  'case.deleted': 'bg-red-50 text-red-700 border border-red-100',
  'cnis.upload': 'bg-cyan-50 text-cyan-700 border border-cyan-100',
  'cnis.processed': 'bg-green-50 text-green-700 border border-green-100',
  'cnis.failed': 'bg-orange-50 text-orange-700 border border-orange-100',
  'calculation.created': 'bg-amber-50 text-amber-700 border border-amber-100',
  'calculation.selected': 'bg-yellow-50 text-yellow-700 border border-yellow-100',
  'simulation.created': 'bg-lime-50 text-lime-700 border border-lime-100',
  'retroative.created': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  'opinion.created': 'bg-rose-50 text-rose-700 border border-rose-100',
  'note.created': 'bg-zinc-50 text-zinc-700 border border-zinc-100',
  'bpc.laudo': 'bg-orange-50 text-orange-700 border border-orange-100',
  'bpc.pre-analysis': 'bg-amber-50 text-amber-700 border border-amber-100',
  'client.created': 'bg-teal-50 text-teal-700 border border-teal-100',
  'client.updated': 'bg-cyan-50 text-cyan-700 border border-cyan-100',
  'client.deleted': 'bg-red-50 text-red-700 border border-red-100',
  'export.pdf': 'bg-slate-50 text-slate-700 border border-slate-100',
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-amber-600" />
        <h1 className="font-serif font-bold text-2xl text-slate-900">Log de Atividades</h1>
      </div>

      <Card variant="light" className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Nenhuma atividade registrada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const metaStr = formatMetadata(log.action, log.metadata as Record<string, unknown>)
              return (
                <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-semibold ${ACTION_COLOR[log.action] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                    {log.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium">{log.resource}</p>
                    {metaStr && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {metaStr}
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </time>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
            <span className="text-sm text-slate-500">{total} registros</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="text-sm text-slate-700 font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
