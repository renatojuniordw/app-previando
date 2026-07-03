'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import dynamic from 'next/dynamic'

const ComparePDFDocument = dynamic(
  () => import('@/components/pdf/ComparePDFDocument').then(m => ({ default: m.ComparePDFDocument })),
  { ssr: false }
)

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => ({ default: mod.PDFDownloadLink })),
  { ssr: false, loading: () => <span>Carregando...</span> }
)
import { CheckCircle2, XCircle, TrendingUp, AlertTriangle, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ModalidadeSugerida {
  modalidade: string
  gender: 'M' | 'F'
  elegivel: boolean
  rmi: number
  coeficiente: number
  tempoContribuicaoAnos: number
  pendencias: string[]
}

interface SuggestionsData {
  elegiveis: ModalidadeSugerida[]
  naoElegiveis: ModalidadeSugerida[]
}

const MODALITY_LABELS: Record<string, string> = {
  APOSENTADORIA_IDADE: 'Apos. por Idade',
  TEMPO_CONTRIBUICAO: 'Tempo de Contribuição',
  PONTOS_86_96: 'Pontos (86/96)',
  PEDAGIO_50: 'Pedágio 50%',
  PEDAGIO_100: 'Pedágio 100%',
  APOSENTADORIA_ESPECIAL: 'Especial',
  HIBRIDA: 'Híbrida',
  IDADE_MINIMA_65_62: 'Idade Mínima 65/62',
  AUXILIO_DOENCA_B31: 'Auxílio-Doença B31',
  PENSAO_MORTE: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
}

const GENDER_LABEL: Record<string, string> = { M: 'Masculino', F: 'Feminino' }

export default function ComparePage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<SuggestionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/cases/${id}/suggest-modalities`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.error ?? 'Erro ao carregar sugestões.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card variant="light" className="p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">{error}</p>
          <p className="text-sm text-slate-500 mt-1">Verifique se o CNIS foi processado e se há data de nascimento do cliente.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Comparativo de Modalidades</h2>
          <p className="text-sm text-slate-500 mt-1">Análise de elegibilidade para todas as modalidades com base no CNIS atual</p>
        </div>
        {data && (
          <PDFDownloadLink
            document={<ComparePDFDocument elegiveis={data.elegiveis} naoElegiveis={data.naoElegiveis} />}
            fileName={`previando-comparativo-${id}.pdf`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </PDFDownloadLink>
        )}
      </div>

      {/* Elegíveis */}
      {(data?.elegiveis?.length ?? 0) > 0 && (
        <div>
          <h3 className="font-sans font-semibold text-sm text-green-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {data!.elegiveis.length} Modalidade{data!.elegiveis.length > 1 ? 's' : ''} Elegível{data!.elegiveis.length > 1 ? 'is' : ''}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data!.elegiveis.map((m, i) => (
              <Card key={`${m.modalidade}-${m.gender}`} variant="light" className={`p-5 border-green-200 ${i === 0 ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{MODALITY_LABELS[m.modalidade] ?? m.modalidade}</p>
                    <p className="text-xs text-slate-500">{GENDER_LABEL[m.gender]}</p>
                  </div>
                  {i === 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">Melhor RMI</span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">RMI</span>
                    <span className="font-bold text-green-700">{formatCurrency(m.rmi)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Coeficiente</span>
                    <span className="text-sm font-semibold text-slate-700">{(m.coeficiente * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Tempo Contrib.</span>
                    <span className="text-sm font-semibold text-slate-700">{m.tempoContribuicaoAnos.toFixed(1)} anos</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Elegível</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Não elegíveis */}
      {(data?.naoElegiveis?.length ?? 0) > 0 && (
        <div>
          <h3 className="font-sans font-semibold text-sm text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> {data!.naoElegiveis.length} Modalidade{data!.naoElegiveis.length > 1 ? 's' : ''} com Pendências
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data!.naoElegiveis.slice(0, 6).map((m) => (
              <Card key={`${m.modalidade}-${m.gender}`} variant="light" className="p-5 opacity-70">
                <div className="mb-3">
                  <p className="font-semibold text-slate-800 text-sm">{MODALITY_LABELS[m.modalidade] ?? m.modalidade}</p>
                  <p className="text-xs text-slate-500">{GENDER_LABEL[m.gender]}</p>
                </div>
                <div className="space-y-1">
                  {m.pendencias.slice(0, 2).map((p, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-slate-600 leading-snug">{p}</span>
                    </div>
                  ))}
                  {m.pendencias.length > 2 && (
                    <p className="text-xs text-slate-400">+{m.pendencias.length - 2} pendência{m.pendencias.length - 2 > 1 ? 's' : ''}</p>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs">RMI potencial: {formatCurrency(m.rmi)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!data?.elegiveis?.length && !data?.naoElegiveis?.length && (
        <Card variant="light" className="p-8 text-center">
          <p className="text-slate-500">Nenhuma modalidade encontrada.</p>
        </Card>
      )}
    </div>
  )
}
