'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, Loader2, AlertCircle, FileUp } from 'lucide-react'

interface PortalDocument {
  id: string
  fileName: string
  contentType: string
  createdAt: string
  downloadUrl: string
}

interface Props {
  token: string
}

export function PortalDocuments({ token }: Props) {
  const [documents, setDocuments] = useState<PortalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/portal/${token}/documents`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setDocuments(data.documents)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [token])

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Não foi possível carregar os documentos.</p>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <FileUp className="w-4 h-4" aria-hidden="true" />
        <span className="font-sans text-sm font-medium uppercase tracking-wide">
          Documentos do Caso
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-sans text-sm font-semibold text-slate-700 truncate">
                  {doc.fileName}
                </p>
              </div>
            </div>
            <a
              href={doc.downloadUrl}
              download={doc.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shrink-0 ml-3"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
