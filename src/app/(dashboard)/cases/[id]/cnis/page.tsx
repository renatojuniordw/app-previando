'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Calendar, FileJson } from 'lucide-react'

interface CnisData {
  id: string
  processingStatus: string
  createdAt: string
  updatedAt: string
  extractedData: Record<string, unknown> | null
  processingError: string | null
}

const STATUS_CONFIG: Record<string, { label: string, color: 'slate' | 'yellow' | 'lime' | 'red' }> = {
  PENDING: { label: 'Aguardando', color: 'slate' },
  PROCESSING: { label: 'Processando', color: 'yellow' },
  COMPLETED: { label: 'Concluído', color: 'lime' },
  FAILED: { label: 'Falhou', color: 'red' },
}

export default function CnisCasePage() {
  const params = useParams()
  const [cnis, setCnis] = useState<CnisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const load = async () => {
    try {
      const r = await api.get(`/cnis/${params.id}`)
      const cnisDoc = r.data.cnisDocument
      setCnis(cnisDoc)
      return cnisDoc as CnisData | null
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [params.id])

  useEffect(() => {
    if (cnis && (cnis.processingStatus === 'PENDING' || cnis.processingStatus === 'PROCESSING')) {
      pollRef.current = setInterval(async () => {
        const updated = await load()
        if (updated && updated.processingStatus !== 'PENDING' && updated.processingStatus !== 'PROCESSING') {
          if (pollRef.current) clearInterval(pollRef.current)
        }
      }, 3000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [cnis?.processingStatus])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caseId', params.id as string)
      await api.post('/cnis/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await load()
    } catch (err: unknown) {
      setUploadError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao enviar CNIS.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full"></div>
        <p className="font-sans font-medium text-slate-500 animate-pulse mt-4">Carregando CNIS...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            Extrato do CNIS
          </h2>
          <p className="font-sans text-sm text-slate-500 mt-1">Gerencie e processe o documento do cliente.</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-amber-600 text-white font-sans font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Enviar Novo CNIS (PDF)
              </>
            )}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="font-sans text-sm font-medium text-red-700">{uploadError}</p>
        </div>
      )}

      {!cnis ? (
        <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50 rounded-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Nenhum CNIS Enviado</h3>
          <p className="font-sans text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Envie o CNIS do segurado em formato PDF. O sistema irá extrair automaticamente os vínculos empregatícios e salários de contribuição.
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-amber-600 text-white font-sans font-semibold text-sm px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando Arquivo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Selecionar Arquivo PDF
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-slate-900">Documento CNIS</h3>
                <p className="font-sans text-xs text-slate-500 font-medium">Análise Automática</p>
              </div>
            </div>
            
            {(() => {
              const config = STATUS_CONFIG[cnis.processingStatus] || { label: cnis.processingStatus, color: 'slate' };
              return (
                <Badge variant={config.color} className="shadow-sm">
                  {config.label}
                </Badge>
              );
            })()}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-sans text-xs uppercase font-bold tracking-wider">Enviado Em</span>
                </div>
                <p className="font-sans font-semibold text-slate-900">{formatDate(cnis.createdAt)}</p>
              </div>
              
              {cnis.processingStatus === 'COMPLETED' && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-sans text-xs uppercase font-bold tracking-wider">Processado Em</span>
                  </div>
                  <p className="font-sans font-semibold text-slate-900">{formatDate(cnis.updatedAt)}</p>
                </div>
              )}
            </div>

            {(cnis.processingStatus === 'PENDING' || cnis.processingStatus === 'PROCESSING') && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0" />
                <p className="font-sans text-sm font-medium text-amber-800">
                  A inteligência artificial está lendo e processando os dados do CNIS. Isso pode levar alguns instantes.
                </p>
              </div>
            )}

            {cnis.processingStatus === 'FAILED' && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-sans text-sm font-bold text-red-800">Falha no Processamento</p>
                  <p className="font-sans text-sm text-red-700 mt-1">{cnis.processingError ?? 'Ocorreu um erro desconhecido ao processar o documento.'}</p>
                </div>
              </div>
            )}

            {cnis.processingStatus === 'COMPLETED' && cnis.extractedData && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileJson className="w-5 h-5 text-slate-400" />
                  <h4 className="font-serif font-bold text-lg text-slate-900">Vínculos Extraídos</h4>
                </div>
                <div className="bg-slate-900 rounded-xl p-4 overflow-hidden shadow-inner">
                  <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-[500px] custom-scrollbar">
                    {JSON.stringify(cnis.extractedData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
