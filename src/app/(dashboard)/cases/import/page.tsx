'use client'

import { useCallback, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/store/toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreviewError {
  linha: number
  cliente_nome: string
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
  imported: number
  errors: Array<{
    row: number
    error: string
  }>
}

type Step = 'upload' | 'preview' | 'importing' | 'done'

export default function CasesImportPage() {
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
      const res = await api.post<PreviewResult>('/cases/import/preview', formData, {
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

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85))
    }, 300)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post<ImportResult>('/cases/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      clearInterval(progressInterval)
      setProgress(100)
      setImportResult(res.data)
      setStep('done')

      const { imported } = res.data
      addToast({
        type: 'success',
        title: 'Importação concluída',
        message: `${imported} processo${imported !== 1 ? 's' : ''} importado${imported !== 1 ? 's' : ''} com sucesso.`,
      })
    } catch (err: unknown) {
      clearInterval(progressInterval)
      setStep('upload')
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao importar processos.'
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
      return <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
    }
    return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
  }

  return (
    <ErrorBoundary>
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
          <Upload className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
            <Link href="/cases" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Processos
            </Link>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Importar Lotes</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">
            Adicione múltiplos processos à sua base de dados a partir de uma planilha Excel ou CSV.
          </p>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card variant="light" className="p-6 border-slate-200/80">
          <div className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[220px]',
                dragging
                  ? 'border-amber-500 bg-amber-50/15 scale-[0.99] shadow-inner'
                  : 'border-slate-200 hover:border-slate-350 bg-slate-50/20 hover:bg-slate-50/40'
              )}
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
                <div className="w-14 h-14 rounded-xl bg-white border border-slate-250 flex items-center justify-center text-slate-400 shadow-sm animate-pulse">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-sans font-bold text-slate-800 text-base">
                    {dragging ? 'Solte a planilha aqui' : 'Arraste sua planilha ou clique para selecionar'}
                  </p>
                  <p className="font-sans text-xs text-slate-400 mt-1 max-w-[340px] leading-relaxed">
                    Formatos suportados: <span className="font-bold text-slate-500">CSV, XLSX ou XLS</span>. Limite máximo recomendado de 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* File selected indicator */}
            {file && (
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/70 rounded-xl hover:border-slate-300/80 transition-all duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-250 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans font-bold text-xs text-slate-800 truncate leading-snug">{file.name}</p>
                    <p className="font-sans text-[10px] text-slate-400 font-semibold">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleNewFile() }} className="font-sans font-bold text-xs text-slate-500 hover:text-slate-700 h-9">
                    Remover
                  </Button>
                  <Button size="sm" onClick={handlePreview} loading={loading} className="bg-slate-900 hover:bg-slate-850 border-slate-900 text-white font-sans font-bold text-xs h-9 shadow-sm">
                    Pré-visualizar
                  </Button>
                </div>
              </div>
            )}

            {/* Template download */}
            <div className="border-t border-slate-100 pt-4 flex flex-col items-center space-y-2.5">
              <p className="font-sans text-[10.5px] text-slate-400 font-bold uppercase tracking-wider text-center">
                Colunas aceitas: Cliente Nome, Cliente CPF, Benefício, Status, Prazo Dias, Observações
              </p>
              <a
                href="/templates/cases-import-template.csv"
                download
                className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar planilha modelo (CSV)
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Total de Linhas</p>
              <p className="font-mono font-bold text-2xl text-slate-900">{preview.total}</p>
            </div>
            <div className="bg-white border border-green-200 bg-green-50/[0.08] rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <p className="font-sans text-[10px] text-green-600 uppercase font-bold tracking-wider mb-2">Prontos p/ Importar</p>
              <p className="font-mono font-bold text-2xl text-green-700">{preview.validos}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Problemas / Duplicados</p>
              <p className="font-mono font-bold text-2xl text-red-600">{preview.erros.length}</p>
            </div>
          </div>

          {/* Erros table */}
          {preview.erros.length > 0 && (
            <Card variant="light" className="p-5 border-slate-200/80">
              <h3 className="font-serif font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 mb-4">
                Inconsistências Identificadas ({preview.erros.length})
              </h3>
              <div className="overflow-x-auto max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Linha</th>
                      <th className="pb-3 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Cliente</th>
                      <th className="pb-3 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Problema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.erros.map((err, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-500 font-bold">{err.linha}</td>
                        <td className="py-2.5 pr-4 font-sans font-semibold text-xs text-slate-800">{err.cliente_nome || '—'}</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1.5">
                            {renderStatusIcon(err.tipo)}
                            <span className={cn('font-sans text-[11px] font-medium leading-none', err.tipo === 'erro' ? 'text-red-655 font-semibold' : 'text-slate-600')}>
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
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-4">
            <p className="font-sans text-xs text-slate-500 font-medium">
              {preview.validos > 0
                ? `${preview.validos} processo${preview.validos !== 1 ? 's' : ''} pronto${preview.validos !== 1 ? 's' : ''} para ser adicionado.`
                : 'Nenhum registro compatível encontrado.'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleNewFile} className="font-sans font-bold text-xs h-9.5">
                Trocar Arquivo
              </Button>
              <Button
                onClick={handleImport}
                disabled={preview.validos === 0}
                className="bg-slate-900 hover:bg-slate-850 text-white border-slate-900 font-sans font-bold text-xs h-9.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                Importar {preview.validos} Processos
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <Card variant="light" className="text-center py-16 border-slate-200/80">
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-slate-900">Processando Importação</h3>
              <p className="font-sans text-xs text-slate-400 font-medium">Cadastrando processos no banco de dados...</p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-md space-y-2">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-350 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="font-mono text-[10px] text-slate-400 font-bold">{progress}%</p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === 'done' && importResult && (
        <div className="space-y-6">
          {/* Resultado geral */}
          <Card variant="light" className="p-5 border-slate-200/80">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">Importação Concluída com Sucesso</h3>
                <p className="font-sans text-xs text-slate-500 mt-0.5 font-medium">
                  {importResult.imported} de {importResult.imported + importResult.errors.length} registros foram salvos.
                </p>
              </div>
            </div>
          </Card>

          {/* Result stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-green-200 bg-green-50/[0.08] rounded-xl p-5 shadow-sm text-center">
              <CheckCircle2 className="w-6 h-6 text-green-650 mx-auto mb-2" />
              <p className="font-mono font-bold text-2xl text-green-750">{importResult.imported}</p>
              <p className="font-sans text-[10px] text-green-600 font-bold uppercase tracking-wider mt-1">Importados</p>
            </div>
            <div className="bg-white border border-red-200 bg-red-50/10 rounded-xl p-5 shadow-sm text-center">
              <XCircle className="w-6 h-6 text-red-650 mx-auto mb-2" />
              <p className="font-mono font-bold text-2xl text-red-750">{importResult.errors.length}</p>
              <p className="font-sans text-[10px] text-red-650 font-bold uppercase tracking-wider mt-1">Erros</p>
            </div>
          </div>

          {/* Detailed errors */}
          {importResult.errors.length > 0 && (
            <Card variant="light" className="p-5 border-slate-200/80">
              <h3 className="font-serif font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 mb-4">Detalhamento dos Erros</h3>
              <div className="overflow-x-auto max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Linha</th>
                      <th className="pb-3 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Erro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importResult.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-500 font-bold">{err.row}</td>
                        <td className="py-2.5 font-sans text-xs text-red-600 font-medium">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-4">
            <p className="font-sans text-xs text-slate-500 font-medium">
              {importResult.imported > 0
                ? `${importResult.imported} processo${importResult.imported !== 1 ? 's' : ''} adicionado${importResult.imported !== 1 ? 's' : ''} à sua base.`
                : 'Nenhum processo novo foi importado.'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleNewFile} className="font-sans font-bold text-xs h-9.5">
                Nova Importação
              </Button>
              <Button onClick={() => router.push('/cases')} className="bg-slate-900 hover:bg-slate-850 text-white border-slate-900 font-sans font-bold text-xs h-9.5 shadow-sm">
                Ir p/ Lista
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  )
}
