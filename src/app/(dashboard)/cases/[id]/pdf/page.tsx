'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { UploadCloud, Trash2, Settings, Play, Check, Loader2, ArrowUp, ArrowDown, AlertCircle, FileText, Download, ShieldCheck } from 'lucide-react'
import { useToast } from '@/store/toast'

interface QueueItem {
  id: string
  tool: string
  toolLabel: string
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  downloadUrl?: string
}

const TOOLS = [
  { id: 'compress', label: 'Comprimir PDF', description: 'Reduza o tamanho do PDF mantendo a qualidade visual.', accept: '.pdf', multiple: false },
  { id: 'merge', label: 'Juntar PDFs', description: 'Combine múltiplos PDFs em um único arquivo na ordem que desejar.', accept: '.pdf', multiple: true },
  { id: 'split', label: 'Dividir PDF', description: 'Extraia um intervalo de páginas específico em um novo PDF.', accept: '.pdf', multiple: false },
  { id: 'from-jpg', label: 'Imagens para PDF', description: 'Converta fotos JPG, JPEG ou PNG em um arquivo PDF único.', accept: '.jpg,.jpeg,.png', multiple: true },
  { id: 'to-markdown', label: 'PDF para Markdown', description: 'Extraia o texto estruturado do PDF em Markdown (ideal para RAG e IAs).', accept: '.pdf', multiple: false },
]

export default function CasePdfToolsPage() {
  const params = useParams()
  const caseId = params.id as string
  const { addToast } = useToast()

  const [selectedTool, setSelectedTool] = useState(TOOLS[0])
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [range, setRange] = useState('')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [caseName, setCaseName] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!caseId) return
    api.get(`/cases/${caseId}`)
      .then(res => {
        const clientName = res.data?.case?.client?.name || 'Cliente'
        const benefit = res.data?.case?.benefitType || 'Caso'
        setCaseName(`${clientName} (${benefit})`)
      })
      .catch(() => null)
  }, [caseId])

  const handleToolChange = (toolId: string) => {
    const tool = TOOLS.find(t => t.id === toolId)!
    setSelectedTool(tool)
    setFiles([])
    setError('')
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addFiles(Array.from(e.target.files))
    }
  }

  const addFiles = (newFiles: File[]) => {
    setError('')
    const extensions = selectedTool.accept.split(',')
    const filtered = newFiles.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      return extensions.some(e => e.trim() === ext)
    })

    if (filtered.length === 0) {
      setError(`Por favor, envie apenas arquivos com as extensões aceitas: ${selectedTool.accept}`)
      return
    }

    if (selectedTool.multiple) {
      setFiles(prev => [...prev, ...filtered])
    } else {
      setFiles([filtered[0]])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === files.length - 1) return

    const newFiles = [...files]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newFiles[index]
    newFiles[index] = newFiles[targetIndex]
    newFiles[targetIndex] = temp
    setFiles(newFiles)
  }

  const executeProcess = async () => {
    if (files.length === 0) {
      setError('Por favor, adicione pelo menos um arquivo.')
      return
    }
    if (selectedTool.id === 'merge' && files.length < 2) {
      setError('A junção exige no mínimo 2 arquivos PDF.')
      return
    }
    if (selectedTool.id === 'split' && !range.trim()) {
      setError('Por favor, informe o intervalo de páginas (ex: 1-5).')
      return
    }

    setLoading(true)
    setError('')

    const jobId = Math.random().toString(36).substring(7)
    const newQueueItem: QueueItem = {
      id: jobId,
      tool: selectedTool.id,
      toolLabel: selectedTool.label,
      fileName: files.length === 1 ? files[0].name : `${files.length} arquivos para unificar`,
      status: 'pending',
      progress: 10,
    }

    setQueue(prev => [newQueueItem, ...prev])

    try {
      const formData = new FormData()
      files.forEach(f => {
        formData.append('file', f)
      })

      if (selectedTool.id === 'compress') {
        formData.append('quality', quality)
      } else if (selectedTool.id === 'split') {
        formData.append('range', range)
      }

      setQueue(prev => prev.map(item => item.id === jobId ? { ...item, status: 'processing', progress: 40 } : item))

      // Envia para a API específica do Caso
      const response = await fetch(`/api/cases/${caseId}/pdf/${selectedTool.id}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro desconhecido no servidor.')
      }

      setQueue(prev => prev.map(item => item.id === jobId ? { ...item, progress: 80 } : item))

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      
      const contentDisposition = response.headers.get('Content-Disposition')
      let outputFilename = `processado_${files[0].name}`
      if (selectedTool.id === 'merge') outputFilename = 'pdf_unificado.pdf'
      if (selectedTool.id === 'from-jpg') outputFilename = 'imagens_convertidas.pdf'
      if (selectedTool.id === 'to-markdown') outputFilename = `${files[0].name.replace(/\.[^.]+$/, '')}.md`
      
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/)
      if (filenameMatch && filenameMatch[1]) {
        outputFilename = filenameMatch[1]
      }

      // Trigar download no navegador
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = outputFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setQueue(prev => prev.map(item => item.id === jobId ? {
        ...item,
        status: 'completed',
        progress: 100,
        downloadUrl,
        fileName: outputFilename
      } : item))

      addToast({
        type: 'success',
        title: 'PDF salvo no prontuário',
        message: `O documento "${outputFilename}" foi anexado com sucesso ao caso do cliente.`,
      })

      // Limpar fila de upload do UI
      setFiles([])
      setRange('')
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Falha na comunicação com a API.'
      setQueue(prev => prev.map(item => item.id === jobId ? { ...item, status: 'failed', error: errMsg } : item))
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Informative Header card */}
      <div className="bg-amber-50/30 border border-amber-200/60 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            Integrado ao Caso: {caseName || 'Carregando...'}
          </h3>
          <p className="font-sans text-xs text-slate-500 max-w-[550px]">
            Todo documento processado através deste painel será **salvo permanentemente no prontuário do cliente**, ficando disponível para download a qualquer momento e servindo de contexto para as análises de Inteligência Artificial.
          </p>
        </div>
      </div>

      {/* Main Workspace: Asymmetric 70/30 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left Side: Configuration & Upload Area (70% on lg) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tool Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TOOLS.map(t => (
              <button
                key={t.id}
                onClick={() => handleToolChange(t.id)}
                disabled={loading}
                className={`text-left p-3 rounded-lg border text-xs transition-all flex flex-col justify-between h-24 ${
                  selectedTool.id === t.id
                    ? 'border-amber-650 bg-amber-50/40 text-slate-900 ring-2 ring-amber-500/20 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350 hover:bg-slate-50/50'
                }`}
              >
                <span className="block font-sans font-bold leading-tight">{t.label}</span>
                <span className="block text-[10px] font-normal text-slate-400 mt-1 line-clamp-2">{t.description}</span>
              </button>
            ))}
          </div>

          {/* Upload & Options Area */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            
            {/* Tool parameters */}
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                Configurar: {selectedTool.label}
              </h3>
              
              {selectedTool.id === 'compress' && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nível de Compressão</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setQuality(lvl)}
                        className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all ${
                          quality === lvl
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-250 text-slate-650 hover:bg-slate-550'
                        }`}
                      >
                        {lvl === 'low' ? 'Baixa (Alta Qualidade)' : lvl === 'medium' ? 'Média (Recomendada)' : 'Alta (Menor Tamanho)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTool.id === 'split' && (
                <div className="mt-3 space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Intervalo de Páginas</label>
                  <input
                    type="text"
                    placeholder="Ex: 1-5 (para extrair das páginas 1 a 5) ou 1,3,5 (para extrair específicas)"
                    value={range}
                    onChange={e => setRange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              )}

              {selectedTool.id === 'merge' && (
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Adicione múltiplos arquivos. Você poderá reordenar a sequência de junção usando as setas antes de processar.
                </p>
              )}

              {selectedTool.id === 'from-jpg' && (
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Envie arquivos de imagem (JPG, PNG). Elas serão montadas em ordem para gerar um arquivo PDF consolidado.
                </p>
              )}

              {selectedTool.id === 'to-markdown' && (
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  O documento será analisado, o texto extraído e estruturado em cabeçalhos e parágrafos legíveis por IAs.
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-red-700 leading-normal">{error}</p>
              </div>
            )}

            {/* Drag & Drop Area */}
            {files.length === 0 || (!selectedTool.multiple && files.length > 0) ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${
                  dragActive
                    ? 'border-amber-500 bg-amber-50/10 scale-[0.99]'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={selectedTool.multiple}
                  accept={selectedTool.accept}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-12 h-12 text-slate-350 mb-3 animate-pulse" />
                <h4 className="font-sans font-bold text-sm text-slate-800 mb-1">
                  Arraste arquivos ou clique para fazer upload
                </h4>
                <p className="font-sans text-xs text-slate-400 max-w-[320px]">
                  Formatos aceitos: <span className="font-semibold text-slate-550">{selectedTool.accept}</span>. Tamanho máximo recomendado por arquivo: 50MB.
                </p>
              </div>
            ) : null}

            {/* File List (Multiple Uploads) */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-sans font-bold text-xs text-slate-500 uppercase tracking-wider">
                    {files.length} {files.length === 1 ? 'Arquivo Selecionado' : 'Arquivos Selecionados'}
                  </span>
                  {selectedTool.multiple && (
                    <button
                      onClick={() => setFiles([])}
                      className="text-xs font-semibold text-red-650 hover:text-red-800 transition-colors"
                    >
                      Remover Todos
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-450 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-sans text-xs font-bold text-slate-800 truncate leading-snug">{file.name}</p>
                          <p className="font-sans text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {selectedTool.multiple && (
                          <>
                            <button
                              onClick={() => moveFile(idx, 'up')}
                              disabled={idx === 0}
                              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Subir na ordem"
                            >
                              <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            <button
                              onClick={() => moveFile(idx, 'down')}
                              disabled={idx === files.length - 1}
                              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Descer na ordem"
                            >
                              <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeFile(idx)}
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-red-100 bg-white hover:bg-red-50 text-red-500"
                          title="Remover arquivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submeter Processamento */}
                <div className="pt-2">
                  <button
                    onClick={executeProcess}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-sans font-bold text-sm py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando e Salvando no Prontuário...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Processar e Salvar no Prontuário
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Processing Queue History (30% on lg) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs h-full min-h-[350px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
                  Histórico deste Caso
                </h3>
                <p className="font-sans text-[10px] text-slate-450 mt-0.5">Acompanhe os arquivos vinculados a este prontuário.</p>
              </div>

              {queue.length === 0 ? (
                <div className="text-center py-16 text-slate-350 space-y-2">
                  <Loader2 className="w-8 h-8 text-slate-200 mx-auto" />
                  <p className="font-sans text-xs">Sem downloads recentes nesta sessão.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {queue.map(item => (
                    <div
                      key={item.id}
                      className="p-3 border border-slate-200/80 rounded-lg bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-sans font-bold text-slate-700 truncate block max-w-[70%]">
                          {item.toolLabel}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : item.status === 'failed'
                              ? 'bg-red-50 text-red-705 border-red-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {item.status === 'completed' && 'Salvo'}
                          {item.status === 'failed' && 'Erro'}
                          {item.status === 'processing' && 'Carregando'}
                          {item.status === 'pending' && 'Fila'}
                        </span>
                      </div>

                      <p className="font-sans text-[10px] text-slate-400 truncate">{item.fileName}</p>

                      {/* Progresso ou Erro */}
                      {item.status === 'failed' && item.error && (
                        <p className="font-sans text-[9px] text-red-650 bg-red-50/20 p-2 border border-red-150/40 rounded leading-normal">
                          {item.error}
                        </p>
                      )}

                      {(item.status === 'processing' || item.status === 'pending') && (
                        <div className="space-y-1">
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {item.status === 'completed' && item.downloadUrl && (
                        <div className="space-y-2 pt-1">
                          <a
                            href={item.downloadUrl}
                            download={item.fileName}
                            className="flex items-center justify-center gap-1.5 bg-emerald-650 hover:bg-emerald-750 text-white font-bold py-1.5 px-3 rounded text-[10px] text-center transition-colors"
                          >
                            <Download className="w-3.0 h-3.0" />
                            Baixar Novamente
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 space-y-1">
              <p className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" /> Vinculado ao prontuário do cliente
              </p>
              <p className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" /> Salvo de forma imutável em nuvem
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
