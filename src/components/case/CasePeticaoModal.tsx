'use client'

import { useState } from 'react'
import { Scale, Loader2, FileText, AlertCircle, CheckCircle2, ArrowLeft, Copy, Download } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/store/toast'
import api from '@/lib/api'

interface CasePeticaoModalProps {
  open: boolean
  onClose: () => void
  caseId: string
}

export function CasePeticaoModal({ open, onClose, caseId }: CasePeticaoModalProps) {
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { addToast } = useToast()

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setContent(null)

    try {
      const res = await api.post(`/cases/${caseId}/peticao`)
      setContent(res.data.content)
      addToast({
        type: 'success',
        title: 'Petição gerada',
        message: `Custo: ~R$ ${(Number(res.data.costUsd) * 6).toFixed(4)}`,
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Erro ao gerar petição. Verifique se há um cálculo selecionado.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      addToast({ type: 'success', title: 'Copiado!' })
    } catch {
      addToast({ type: 'error', title: 'Erro ao copiar' })
    }
  }

  const handleDownload = () => {
    if (!content) return
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `peticao-inicial-${caseId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal open={open} onClose={onClose} title="PETIÇÃO INICIAL" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Scale className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            A petição inicial é gerada com IA com base no cálculo selecionado, dados do cliente e resumo do CNIS.
            Revise o conteúdo antes de protocolar.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {!content && !loading && (
          <div className="py-8 flex flex-col items-center text-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 mb-4">
              Clique no botão abaixo para gerar a petição inicial com IA.
            </p>
            <Button
              onClick={handleGenerate}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              <Scale className="w-4 h-4 mr-2" />
              Gerar Petição Inicial
            </Button>
          </div>
        )}

        {loading && (
          <div className="py-12 flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Gerando petição inicial...</p>
          </div>
        )}

        {content && (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Petição gerada com sucesso</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg max-h-96 overflow-y-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {content}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 border-slate-300 text-slate-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1 border-slate-300 text-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download .txt
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
              >
                Fechar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
