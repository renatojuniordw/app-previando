'use client'

import { useCallback, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/store/toast'
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download, Loader2 } from 'lucide-react'

interface PreviewError {
  linha: number
  nome: string
  mensagem: string
  tipo: 'erro' | 'duplicata'
}

interface PreviewResult {
  total: number
  validos: number
  duplicatas: number
  erros: PreviewError[]
}

interface ImportResult {
  created: number
  total: number
  results: Array<{
    row: number
    status: 'created' | 'duplicate' | 'error'
    message?: string
    nome?: string
  }>
}

type Step = 'upload' | 'preview' | 'importing' | 'done'

export default function ClientsImportPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const ACCEPTED_TYPES = '.csv,.xlsx,.xls'

  const validateFile = (f: File): string | null => {
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (f.size > maxSize) return 'Arquivo muito grande. O limite é 2MB.'
    const name = f.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      return 'Formato não suportado. Use arquivos .csv ou .xlsx.'
    }
    return null
  }

  const handleFile = useCallback((f: File) => {
    const error = validateFile(f)
    if (error) {
      addToast({ type: 'error', title: 'Arquivo inválido', message: error })
      return
    }
    setFile(f)
    setStep('upload')
  }, [addToast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handlePreview = async () => {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post<PreviewResult>('/clients/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPreview(res.data)
      setStep('preview')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao processar arquivo.'
      addToast({ type: 'error', title: 'Erro na pré-visualização', message: msg })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setStep('importing')
    setProgress(0)

    // Simula progresso enquanto a importação acontece
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85))
    }, 300)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post<ImportResult>('/clients/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      clearInterval(progressInterval)
      setProgress(100)
      setImportResult(res.data)
      setStep('done')

      const { created, total } = res.data
      addToast({
        type: 'success',
        title: 'Importação concluída',
        message: `${created} de ${total} clientes importados com sucesso.`,
      })
    } catch (err: unknown) {
      clearInterval(progressInterval)
      setStep('upload')
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao importar clientes.'
      addToast({ type: 'error', title: 'Erro na importação', message: msg })
    }
  }

  const handleNewFile = () => {
    setFile(null)
    setPreview(null)
    setImportResult(null)
    setProgress(0)
    setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const renderStatusIcon = (tipo: 'erro' | 'duplicata') => {
    if (tipo === 'erro') {
      return <XCircle className="w-4 h-4 text-red-500 shrink-0" />
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/clients/list"
            className="inline-flex items-center gap-1.5 text-sm font-sans text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para clientes
          </Link>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Importar Clientes</h1>
          <p className="font-sans text-sm text-slate-500 mt-1 font-medium">
            Importe clientes em lote a partir de arquivos CSV ou Excel
          </p>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card variant="light">
          <div className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative cursor-pointer border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                ${dragging
                  ? 'border-amber-500 bg-amber-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileInput}
                className="hidden"
                aria-label="Selecionar arquivo para importação"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                  <Upload className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <p className="font-sans font-semibold text-slate-900 text-lg">
                    {dragging ? 'Solte o arquivo aqui' : 'Arraste o arquivo ou clique para selecionar'}
                  </p>
                  <p className="font-sans text-sm text-slate-500 mt-1">
                    Formatos aceitos: CSV (.csv) e Excel (.xlsx, .xls) — Máximo 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* File selected indicator */}
            {file && (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-sans font-semibold text-sm text-slate-900">{file.name}</p>
                    <p className="font-sans text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleNewFile() }}>
                    Remover
                  </Button>
                  <Button size="sm" onClick={handlePreview} loading={loading}>
                    Pré-visualizar
                  </Button>
                </div>
              </div>
            )}

            {/* Template download */}
            <div className="border-t border-slate-200 pt-4">
              <p className="font-sans text-xs text-slate-500 mb-2 text-center">
                Colunas esperadas: Nome, CPF, Data Nascimento, Telefone, Email, Prioridade, Observações
              </p>
              <div className="flex justify-center">
                <a
                  href="/templates/clientes-import-template.csv"
                  download
                  className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar modelo CSV
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card variant="light" className="text-center">
              <p className="font-sans text-2xl font-bold text-slate-900">{preview.total}</p>
              <p className="font-sans text-xs text-slate-500 mt-1">Total de linhas</p>
            </Card>
            <Card variant="light" className="text-center border-green-200 bg-green-50/50">
              <p className="font-sans text-2xl font-bold text-green-700">{preview.validos}</p>
              <p className="font-sans text-xs text-green-600 mt-1">Válidos para importar</p>
            </Card>
            <Card variant="light" className="text-center">
              <p className="font-sans text-2xl font-bold text-red-600">{preview.erros.length}</p>
              <p className="font-sans text-xs text-slate-500 mt-1">
                {preview.duplicatas > 0 ? `${preview.duplicatas} duplicatas` : 'Erros'}
              </p>
            </Card>
          </div>

          {/* Erros table */}
          {preview.erros.length > 0 && (
            <Card variant="light">
              <h3 className="font-sans font-semibold text-sm text-slate-900 mb-3">
                Problemas encontrados ({preview.erros.length})
              </h3>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Linha</th>
                      <th className="pb-2 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Nome</th>
                      <th className="pb-2 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Problema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.erros.map((err, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-2 pr-4 font-sans text-slate-500">{err.linha}</td>
                        <td className="py-2 pr-4 font-sans font-medium text-slate-900">{err.nome}</td>
                        <td className="py-2">
                          <span className="inline-flex items-center gap-1.5">
                            {renderStatusIcon(err.tipo)}
                            <span className={`font-sans text-xs ${err.tipo === 'erro' ? 'text-red-600' : 'text-yellow-700'}`}>
                              {err.mensagem}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="font-sans text-sm text-slate-600">
              {preview.validos > 0
                ? `${preview.validos} cliente${preview.validos !== 1 ? 's' : ''} pronto${preview.validos !== 1 ? 's' : ''} para importar.`
                : 'Nenhum registro válido encontrado.'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleNewFile}>
                Escolher outro arquivo
              </Button>
              <Button
                onClick={handleImport}
                disabled={preview.validos === 0}
                className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
              >
                <Upload className="w-4 h-4" />
                Importar {preview.validos} cliente{preview.validos !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <Card variant="light" className="text-center py-12">
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
            <div className="space-y-2">
              <h3 className="font-sans font-semibold text-lg text-slate-900">Importando clientes...</h3>
              <p className="font-sans text-sm text-slate-500">Isso pode levar alguns segundos.</p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-md">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="font-sans text-xs text-slate-400 mt-2">{progress}%</p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === 'done' && importResult && (
        <div className="space-y-4">
          {/* Resultado geral */}
          <Card variant="light">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-lg text-slate-900">Importação concluída</h3>
                <p className="font-sans text-sm text-slate-500">
                  {importResult.created} de {importResult.total} clientes importados com sucesso.
                </p>
              </div>
            </div>
          </Card>

          {/* Result stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card variant="light" className="text-center border-green-200 bg-green-50/50">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="font-sans text-2xl font-bold text-green-700">{importResult.created}</p>
              <p className="font-sans text-xs text-green-600 mt-1">Importados</p>
            </Card>
            <Card variant="light" className="text-center border-yellow-200 bg-yellow-50/50">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="font-sans text-2xl font-bold text-yellow-700">
                {importResult.results.filter((r) => r.status === 'duplicate').length}
              </p>
              <p className="font-sans text-xs text-yellow-600 mt-1">Duplicatas</p>
            </Card>
            <Card variant="light" className="text-center border-red-200 bg-red-50/50">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="font-sans text-2xl font-bold text-red-700">
                {importResult.results.filter((r) => r.status === 'error').length}
              </p>
              <p className="font-sans text-xs text-red-600 mt-1">Erros</p>
            </Card>
          </div>

          {/* Detailed results */}
          {importResult.results.filter((r) => r.status !== 'created').length > 0 && (
            <Card variant="light">
              <h3 className="font-sans font-semibold text-sm text-slate-900 mb-3">Detalhamento</h3>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Linha</th>
                      <th className="pb-2 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Nome</th>
                      <th className="pb-2 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="pb-2 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Detalhe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importResult.results.map((r, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-2 pr-4 font-sans text-slate-500">{r.row}</td>
                        <td className="py-2 pr-4 font-sans font-medium text-slate-900">{r.nome ?? '—'}</td>
                        <td className="py-2 pr-4">
                          {r.status === 'created' ? (
                            <Badge variant="green">Importado</Badge>
                          ) : r.status === 'duplicate' ? (
                            <Badge variant="yellow">Duplicata</Badge>
                          ) : (
                            <Badge variant="red">Erro</Badge>
                          )}
                        </td>
                        <td className="py-2 font-sans text-slate-500">{r.message ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="font-sans text-sm text-slate-600">
              {importResult.created > 0
                ? `${importResult.created} cliente${importResult.created !== 1 ? 's' : ''} adicionado${importResult.created !== 1 ? 's' : ''} à sua base.`
                : 'Nenhum cliente foi importado.'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleNewFile}>
                Importar outro arquivo
              </Button>
              <Button onClick={() => router.push('/clients/list')}>
                Ver lista de clientes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
