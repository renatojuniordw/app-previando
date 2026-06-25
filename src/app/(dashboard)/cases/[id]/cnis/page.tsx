'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/store/toast'
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react'

interface CnisData {
  id: string
  processingStatus: string
  createdAt: string
  updatedAt: string
  extractedData: Record<string, unknown> | null
  processingError: string | null
}

interface Periodo {
  empregador: string
  inicio: string
  fim: string | null
  salarios: Array<{ competencia: string; valor: number }>
}

interface CnisExtractedData {
  nit?: string
  nome?: string
  dataNascimento?: string
  totalContribuicoes?: number
  primeiraContribuicao?: string
  ultimaContribuicao?: string
  periodos?: Periodo[]
}

const STATUS_CONFIG: Record<string, { label: string; color: 'slate' | 'yellow' | 'lime' | 'red' | 'blue' }> = {
  PENDING: { label: 'Aguardando', color: 'slate' },
  PROCESSING: { label: 'Processando resumo...', color: 'yellow' },
  SUMMARY_READY: { label: 'Resumo pronto', color: 'blue' },
  PROCESSING_DETAILS: { label: 'Processando salários...', color: 'yellow' },
  COMPLETED: { label: 'Concluído', color: 'lime' },
  FAILED: { label: 'Falhou', color: 'red' },
}

const PROCESSING_STATUSES = ['PENDING', 'PROCESSING', 'SUMMARY_READY', 'PROCESSING_DETAILS'] as const
const isProcessingStatus = (status: string): boolean => PROCESSING_STATUSES.includes(status as typeof PROCESSING_STATUSES[number])

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatCompetencia = (comp: string) => {
  if (!comp) return 'N/A'
  const parts = comp.split('-')
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}` // YYYY-MM -> MM/YYYY
  }
  return comp
}

const formatDateString = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}` // YYYY-MM-DD -> DD/MM/YYYY
  }
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}` // YYYY-MM -> MM/YYYY
  }
  return dateStr
}

export default function CnisCasePage() {
  const params = useParams()
  const [cnis, setCnis] = useState<CnisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [expandedPeriod, setExpandedPeriod] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const [stuckWarning, setStuckWarning] = useState(false)
  const { addToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const stuckRef = useRef<NodeJS.Timeout | null>(null)

  const load = useCallback(async () => {
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
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (cnis && isProcessingStatus(cnis.processingStatus)) {
      setStuckWarning(false)
      stuckRef.current = setTimeout(() => setStuckWarning(true), 180_000)

      pollRef.current = setInterval(async () => {
        const updated = await load()
        if (updated) {
          if (updated.processingStatus === 'COMPLETED') {
            setShowSuccessBanner(true)
            setStuckWarning(false)
            setTimeout(() => setShowSuccessBanner(false), 5000)

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('Previando - CNIS Concluído', {
                  body: `O processamento do CNIS do segurado foi concluído com sucesso.`,
                })
              } catch (err) {
                console.error(err)
              }
            }
          } else if (updated.processingStatus === 'FAILED') {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('Previando - Falha no CNIS', {
                  body: `Ocorreu uma falha no processamento do CNIS: ${updated.processingError || 'Erro desconhecido'}`,
                })
              } catch (err) {
                console.error(err)
              }
            }
          }
        }
        if (updated && !isProcessingStatus(updated.processingStatus)) {
          if (pollRef.current) clearInterval(pollRef.current)
          if (stuckRef.current) clearTimeout(stuckRef.current)
        }
      }, 3000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (stuckRef.current) clearTimeout(stuckRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnis?.processingStatus])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Solicitar permissão de notificação nativa ao subir arquivo
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caseId', params.id as string)
      await api.post('/cnis/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      addToast({ type: 'info', title: 'CNIS enviado', message: 'Processando extrato do segurado...' })
      await load()
    } catch (err: unknown) {
      setUploadError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao enviar CNIS.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete(`/cnis/${params.id}`)
      setCnis(null)
      setShowDeleteModal(false)
      addToast({ type: 'success', title: 'CNIS excluído' })
    } catch (err: unknown) {
      setDeleteError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao excluir extrato do CNIS.')
    } finally {
      setDeleting(false)
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

  const isProcessing = cnis ? isProcessingStatus(cnis.processingStatus) : false

  const togglePeriod = (index: number) => {
    setExpandedPeriod(expandedPeriod === index ? null : index)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      {/* Estilos para animação da barra de carregamento e slide-down */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s infinite linear;
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out forwards;
        }
      `}} />

      {/* Overlay de Bloqueio com Glassmorphism para Envio */}
      {uploading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center space-y-6 animate-slide-down">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200 text-amber-600 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-slate-900">
                Enviando documento...
              </h3>
              <p className="font-sans text-sm text-slate-500 leading-relaxed">
                O arquivo está sendo enviado de forma segura para o nosso servidor.
              </p>
            </div>
            
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full w-1/2 animate-loading-bar"></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            Extrato do CNIS
          </h2>
          <p className="font-sans text-sm text-slate-500 mt-1">Gerencie e processe o documento do cliente.</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
          {cnis && (
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={uploading || deleting}
              className="border border-red-200 text-red-600 hover:bg-red-50 font-sans font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
              aria-label="Excluir extrato do CNIS"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Excluir CNIS
            </button>
          )}
          {(!cnis || cnis.processingStatus === 'FAILED') && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || isProcessing || deleting}
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
          )}
        </div>
      </div>

      {showSuccessBanner && (
        <div className="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-xl p-4 flex items-center justify-between gap-3 animate-slide-down shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-sans text-sm font-semibold">
              O CNIS foi processado e todos os dados foram extraídos com sucesso pela inteligência artificial!
            </span>
          </div>
          <button 
            onClick={() => setShowSuccessBanner(false)}
            className="text-emerald-500 hover:text-emerald-700 font-sans text-xs font-bold uppercase transition-colors shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

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
            disabled={uploading || isProcessing}
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
              
              {['COMPLETED', 'SUMMARY_READY', 'PROCESSING_DETAILS'].includes(cnis.processingStatus) && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-sans text-xs uppercase font-bold tracking-wider">Processado Em</span>
                  </div>
                  <p className="font-sans font-semibold text-slate-900">{formatDate(cnis.updatedAt)}</p>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="space-y-3">
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0" />
                  <p className="font-sans text-sm font-medium text-amber-800">
                    {cnis.processingStatus === 'SUMMARY_READY'
                      ? 'Resumo pronto! Processando salários detalhados em background...'
                      : cnis.processingStatus === 'PROCESSING_DETAILS'
                        ? 'Processando salários detalhados... Isso pode levar 1-2 minutos.'
                        : 'A inteligência artificial está lendo e processando os dados do CNIS. Isso pode levar alguns instantes.'}
                  </p>
                </div>
                {stuckWarning && (
                  <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-sans text-sm font-bold text-orange-800">Processamento mais lento que o esperado</p>
                      <p className="font-sans text-sm text-orange-700 mt-1">
                        O documento está sendo processado há mais de 3 minutos. Verifique se o servidor de processamento em background (<code className="font-mono text-xs bg-orange-100 px-1 rounded">npm run worker</code>) está em execução.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {cnis.processingStatus === 'FAILED' && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-sans text-sm font-bold text-red-800">Falha no Processamento</p>
                  <p className="font-sans text-sm text-red-700 mt-1">
                    {cnis.processingError
                      ? cnis.processingError.replace(/^Error:\s*/i, '')
                      : 'Ocorreu um erro ao processar o documento. Tente enviar o CNIS novamente.'}
                  </p>
                  <p className="font-sans text-xs text-red-500 mt-2">
                    Exclua o documento e envie novamente para tentar outra vez.
                  </p>
                </div>
              </div>
            )}

            {['COMPLETED', 'SUMMARY_READY'].includes(cnis.processingStatus) && cnis.extractedData && (() => {
              const data = cnis.extractedData as unknown as CnisExtractedData
              
              return (
                <div className="space-y-8 mt-6">
                  {/* Grid de Informações do Segurado */}
                  <div className="border-t border-slate-150 pt-6">
                    <h4 className="font-serif font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-amber-600" />
                      Dados Identificados do Segurado
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-amber-50/20 border border-amber-100/30 rounded-xl p-4">
                        <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Nome Completo</span>
                        <span className="font-sans font-bold text-slate-800 text-sm">{data.nome ?? 'Não identificado'}</span>
                      </div>
                      <div className="bg-amber-50/20 border border-amber-100/30 rounded-xl p-4">
                        <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">NIT / PIS</span>
                        <span className="font-sans font-bold text-slate-800 text-sm">{data.nit ?? 'Não identificado'}</span>
                      </div>
                      <div className="bg-amber-50/20 border border-amber-100/30 rounded-xl p-4">
                        <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Data de Nascimento</span>
                        <span className="font-sans font-bold text-slate-800 text-sm">{formatDateString(data.dataNascimento ?? '')}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Total de Contribuições</span>
                        <span className="font-sans font-bold text-slate-800 text-sm">{data.totalContribuicoes ?? data.periodos?.reduce((acc, p) => acc + (p.salarios?.length || 0), 0) ?? 0} competências</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Primeira Contribuição</span>
                        <span className="font-sans font-bold text-slate-800 text-sm">{formatDateString(data.primeiraContribuicao ?? '')}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Última Contribuição</span>
                        <span className="font-sans font-bold text-slate-800 text-sm">{formatDateString(data.ultimaContribuicao ?? '')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Listagem de Vínculos/Períodos */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-amber-600" />
                        Histórico de Vínculos Empregatícios
                      </h4>
                      <span className="font-sans text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
                        {data.periodos?.length ?? 0} {data.periodos?.length === 1 ? 'vínculo' : 'vínculos'}
                      </span>
                    </div>

                    {!data.periodos || data.periodos.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 border border-slate-150 rounded-xl">
                        <p className="font-sans text-slate-500 text-sm">Nenhum vínculo detalhado foi identificado.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.periodos.map((periodo, idx) => {
                          const isExpanded = expandedPeriod === idx
                          return (
                            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                              {/* Header do Período */}
                              <button
                                type="button"
                                onClick={() => togglePeriod(idx)}
                                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/50 transition-colors"
                              >
                                <div className="space-y-1.5 min-w-0 flex-1">
                                  <h5 className="font-sans font-bold text-slate-800 truncate text-sm sm:text-base tracking-tight">
                                    {periodo.empregador || 'EMPREGADOR NÃO INFORMADO'}
                                  </h5>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                      {formatDateString(periodo.inicio)} a {periodo.fim ? formatDateString(periodo.fim) : 'Em andamento'}
                                    </span>
                                    {periodo.salarios && periodo.salarios.length > 0 && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold">
                                        {periodo.salarios.length} contribuições
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-slate-400 shrink-0 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                  {isExpanded ? <ChevronUp className="w-5 h-5 text-amber-600" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                </div>
                              </button>

                              {/* Accordion Content */}
                              {isExpanded && (
                                <div className="border-t border-slate-150 bg-slate-50/30 px-5 py-5 animate-slide-down">
                                  {periodo.salarios && periodo.salarios.length > 0 ? (
                                    <div className="space-y-3">
                                      <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Detalhamento de Salários</span>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                                        {periodo.salarios.map((sal, sIdx) => (
                                          <div key={sIdx} className="bg-white border border-slate-150 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors">
                                            <span className="font-sans text-[10px] text-slate-400 font-bold">{formatCompetencia(sal.competencia)}</span>
                                            <span className="font-sans font-bold text-slate-800 text-xs sm:text-sm mt-1">{formatCurrency(sal.valor)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 py-2 text-slate-500 text-xs sm:text-sm">
                                      <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                                      <span>Nenhum salário de contribuição registrado ou extraído para este período.</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal 
        open={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="EXCLUIR EXTRATO DO CNIS?"
      >
        <div className="space-y-4 font-sans text-sm text-slate-600 leading-relaxed">
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Atenção: Ação Irreversível!</p>
              <p className="text-xs text-red-700 mt-1">
                Ao excluir o CNIS deste caso, todos os cálculos, simulações, retroativos, checklists e pareceres vinculados a ele serão <strong>excluídos permanentemente</strong> do banco de dados e precisarão ser refeitos.
              </p>
            </div>
          </div>

          <p>
            <strong>Por que isso acontece?</strong> Os cálculos e pareceres do caso foram gerados e estruturados com base direta nas informações extraídas deste extrato de CNIS. Sem ele, esses dados perdem a consistência e a origem, tornando-se inválidos.
          </p>


          {deleteError && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
              {deleteError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg text-center transition-colors font-sans text-sm flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'SIM, EXCLUIR TUDO'
              )}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="flex-1 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold py-2.5 px-4 rounded-lg text-center transition-colors font-sans text-sm"
            >
              CANCELAR
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
