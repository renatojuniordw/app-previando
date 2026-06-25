'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
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
  'case.created': 'bg-blue-100 text-blue-700',
  'calculation.created': 'bg-amber-100 text-amber-700',
  'opinion.created': 'bg-purple-100 text-purple-700',
  'cnis.upload': 'bg-cyan-100 text-cyan-700',
  'cnis.processed': 'bg-green-100 text-green-700',
  'export.pdf': 'bg-slate-100 text-slate-700',
  'client.created': 'bg-teal-100 text-teal-700',
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 25

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/activity?page=${page}&limit=${limit}`)
      setLogs(res.data.logs)
      setTotal(res.data.total)
    } catch {}
    setLoading(false)
  }, [page])

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
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-semibold ${ACTION_COLOR[log.action] ?? 'bg-slate-100 text-slate-700'}`}>
                  {log.label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{log.resource}</p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {Object.entries(log.metadata).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                    </p>
                  )}
                </div>
                <time className="shrink-0 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </time>
              </div>
            ))}
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
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-700 font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
