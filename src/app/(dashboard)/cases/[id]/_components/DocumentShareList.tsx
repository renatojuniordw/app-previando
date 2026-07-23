'use client'

import { useEffect, useState } from 'react'
import { FileText, Loader2, Check, X, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface CaseDocument {
  id: string
  fileName: string
  shared: boolean
  createdAt: string
}

interface Props {
  caseId: string
}

export function DocumentShareList({ caseId }: Props) {
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get(`/cases/${caseId}/documents`)
      .then((res) => {
        if (!cancelled) setDocuments(res.data.documents || [])
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [caseId])

  const toggleShare = async (docId: string) => {
    setToggling(docId)
    try {
      const res = await api.patch(`/cases/${caseId}/documents/${docId}/share`)
      const updated = res.data.document
      setDocuments((prev) =>
        prev.map((d) => (d.id === updated.id ? { ...d, shared: updated.shared } : d))
      )
    } catch {
      setError(true)
    } finally {
      setToggling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-3 text-slate-400">
        <AlertCircle className="w-4 h-4" />
        <p className="text-xs">Erro ao carregar documentos.</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="py-3 text-center">
        <FileText className="w-5 h-5 text-slate-300 mx-auto mb-1" />
        <p className="text-xs text-slate-400">Nenhum documento disponível.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-2">
        Compartilhar documentos
      </p>
      {documents.map((doc) => (
        <button
          key={doc.id}
          onClick={() => toggleShare(doc.id)}
          disabled={toggling === doc.id}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors text-left"
        >
          <div
            className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
              doc.shared
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-200 group-hover:border-slate-300'
            )}
          >
            {doc.shared ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
          </div>
          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          <span className={cn(
            'text-xs font-semibold flex-1 truncate',
            doc.shared ? 'text-slate-700' : 'text-slate-400'
          )}>
            {doc.fileName}
          </span>
          {toggling === doc.id && (
            <Loader2 className="w-3 h-3 animate-spin text-slate-400 shrink-0" />
          )}
        </button>
      ))}
    </div>
  )
}
