'use client'

import { useState, useRef } from 'react'
import { 
  ArrowLeft, Files, UploadCloud, Trash2, Settings, Play, Check, Loader2, 
  ArrowUp, ArrowDown, AlertCircle, FileText, Download, FileDown, Combine, 
  Scissors, Image, FileCode 
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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

interface ToolConfig {
  id: string
  label: string
  description: string
  accept: string
  multiple: boolean
  icon: React.ComponentType<{ className?: string }>
}

const TOOLS: ToolConfig[] = [
  { id: 'compress', label: 'Comprimir PDF', description: 'Reduza o tamanho do PDF mantendo a qualidade.', accept: '.pdf', multiple: false, icon: FileDown },
  { id: 'merge', label: 'Juntar PDFs', description: 'Combine múltiplos PDFs em um único arquivo.', accept: '.pdf', multiple: true, icon: Combine },
  { id: 'split', label: 'Dividir PDF', description: 'Extraia páginas específicas em um novo PDF.', accept: '.pdf', multiple: false, icon: Scissors },
  { id: 'from-jpg', label: 'Imagens para PDF', description: 'Converta fotos JPG/PNG em arquivo PDF único.', accept: '.jpg,.jpeg,.png', multiple: true, icon: Image },
  { id: 'to-markdown', label: 'PDF para Markdown', description: 'Extraia texto estruturado em MD para IAs.', accept: '.pdf', multiple: false, icon: FileCode },
]

export default function PdfToolsPage() {
  const [selectedTool, setSelectedTool] = useState<ToolConfig>(TOOLS[0])
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [range, setRange] = useState('')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      const response = await fetch(`/api/pdf/${selectedTool.id}`, {
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
          <Files className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Ferramentas
            </Link>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">PDFs Integrados</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">
            Processe, comprima, divida e junte documentos sem sair do sistema de advocacia. Nenhum arquivo é guardado no servidor.
          </p>
        </div>
      </div>

      {/* Main Workspace: Asymmetric 70/30 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-8">
        
        {/* Left Side: Configuration & Upload Area (70% on lg) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tool Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TOOLS.map(t => {
              const Icon = t.icon
              const isSelected = selectedTool.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => handleToolChange(t.id)}
                  disabled={loading}
                  className={cn(
                    'text-left p-4 rounded-xl border text-xs transition-all duration-200 flex flex-col justify-between h-28',
                    isSelected
                      ? 'border-amber-500 bg-amber-50/20 text-slate-900 ring-1 ring-amber-500 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200',
                    isSelected ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                  )}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="block font-sans font-bold leading-tight mt-2">{t.label}</span>
                    <span className="block text-[9px] font-medium text-slate-400 mt-1 line-clamp-2 leading-tight">{t.description}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Upload & Options Area */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            
            {/* Tool parameters */}
            <div className="border-b border-slate-100 pb-5">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                Configurar: {selectedTool.label}
              </h3>
              
              {selectedTool.id === 'compress' && (
                <div className="mt-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Nível de Compressão</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setQuality(lvl)}
                        className={cn(
                          'text-xs font-bold px-4 py-2.5 rounded-lg border transition-all duration-205',
                          quality === lvl
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                        )}
                      >
                        {lvl === 'low' ? 'Baixa (Alta Qualidade)' : lvl === 'medium' ? 'Média (Recomendada)' : 'Alta (Menor Tamanho)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTool.id === 'split' && (
                <div className="mt-4 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Intervalo de Páginas</label>
                  <input
                    type="text"
                    placeholder="Ex: 1-5 (para extrair das páginas 1 a 5) ou 1,3,5 (para extrair específicas)"
                    value={range}
                    onChange={e => setRange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                  />
                </div>
              )}

              {selectedTool.id === 'merge' && (
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  Adicione múltiplos arquivos. Você poderá reordenar a sequência de junção usando as setas antes de processar.
                </p>
              )}

              {selectedTool.id === 'from-jpg' && (
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  Envie arquivos de imagem (JPG, PNG). Elas serão montadas em ordem para gerar um arquivo PDF consolidado.
                </p>
              )}

              {selectedTool.id === 'to-markdown' && (
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  O documento será analisado, o texto extraído e estruturado em cabeçalhos e parágrafos legíveis por IAs.
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-red-700 leading-normal font-medium">{error}</p>
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
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px]',
                  dragActive
                    ? 'border-amber-500 bg-amber-50/15 scale-[0.99] shadow-inner'
                    : 'border-slate-200/80 hover:border-slate-350 bg-slate-50/20 hover:bg-slate-50/40'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={selectedTool.multiple}
                  accept={selectedTool.accept}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                <h4 className="font-sans font-bold text-sm text-slate-800 mb-1">
                  Arraste arquivos ou clique para fazer upload
                </h4>
                <p className="font-sans text-xs text-slate-400 max-w-[320px] leading-relaxed">
                  Formatos aceitos: <span className="font-bold text-slate-500">{selectedTool.accept}</span>. Tamanho máximo recomendado por arquivo: 50MB.
                </p>
              </div>
            ) : null}

            {/* File List (Multiple Uploads) */}
            {files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-sans font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">
                    {files.length} {files.length === 1 ? 'Arquivo Selecionado' : 'Arquivos Selecionados'}
                  </span>
                  {selectedTool.multiple && (
                    <button
                      onClick={() => setFiles([])}
                      className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Remover Todos
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/70 rounded-xl hover:border-slate-300/80 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-250 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-sans text-xs font-bold text-slate-800 truncate leading-snug">{file.name}</p>
                          <p className="font-sans text-[10px] text-slate-400 font-semibold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {selectedTool.multiple && (
                          <>
                            <button
                              onClick={() => moveFile(idx, 'up')}
                              disabled={idx === 0}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Subir na ordem"
                            >
                              <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            <button
                              onClick={() => moveFile(idx, 'down')}
                              disabled={idx === files.length - 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Descer na ordem"
                            >
                              <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeFile(idx)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-100 bg-white hover:bg-red-50 text-red-500 transition-colors"
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
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-sm py-3 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando no Servidor...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Processar Arquivo(s)
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full min-h-[350px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Fila de Processamento
                </h3>
                <p className="font-sans text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Acompanhe seus jobs recentes</p>
              </div>

              {queue.length === 0 ? (
                <div className="text-center py-16 text-slate-350 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-250 flex items-center justify-center mx-auto text-slate-350 shadow-sm">
                    <Loader2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="font-sans text-xs font-semibold text-slate-400">Nenhum processo na fila.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {queue.map(item => (
                    <div
                      key={item.id}
                      className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm space-y-3 text-xs hover:border-slate-300 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-sans font-bold text-slate-800 truncate block max-w-[70%]">
                          {item.toolLabel}
                        </span>
                        <span className={cn(
                          'text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border tracking-wider',
                          item.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : item.status === 'failed'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                        )}>
                          {item.status === 'completed' && 'Pronto'}
                          {item.status === 'failed' && 'Erro'}
                          {item.status === 'processing' && 'Ajustando'}
                          {item.status === 'pending' && 'Fila'}
                        </span>
                      </div>

                      <p className="font-sans text-[10px] text-slate-400 font-semibold truncate">{item.fileName}</p>

                      {item.status === 'failed' && item.error && (
                        <p className="font-sans text-[9px] text-red-600 bg-red-50/50 p-2.5 border border-red-100 rounded-lg leading-relaxed font-medium">
                          {item.error}
                        </p>
                      )}

                      {(item.status === 'processing' || item.status === 'pending') && (
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {item.status === 'completed' && item.downloadUrl && (
                        <a
                          href={item.downloadUrl}
                          download={item.fileName}
                          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-[10px] text-center transition-colors shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar Novamente
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4 text-[10px] text-slate-400 space-y-1.5 font-medium">
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Processamento seguro via HTTPS
              </p>
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Nginx rate limiting e filas ativas
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
