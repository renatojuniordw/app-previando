'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { FileText, Download, Send, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, ExternalLink, FileSignature } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import api from '@/lib/api'
import { useToast } from '@/store/toast'

// ─── Types ───────────────────────────────────────────────────────────────

interface Assinatura {
  id: string
  caseId: string
  tipoDocumento: string
  processoKey: string
  signUrl: string | null
  status: string
  signers: Array<{ name: string; email: string }>
  createdAt: string
  completedAt: string | null
}

const TIPO_DOCUMENTO_LABELS: Record<string, string> = {
  PROCURACAO: 'Procuração',
  PETICAO: 'Petição Inicial',
  CONTRATO: 'Contrato de Honorários',
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'yellow' | 'green' | 'red' | 'slate'; icon: React.ReactNode }> = {
  PENDING: { label: 'Pendente', variant: 'yellow', icon: <Clock className="w-3.5 h-3.5" /> },
  SIGNED: { label: 'Assinado', variant: 'green', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELLED: { label: 'Cancelado', variant: 'red', icon: <XCircle className="w-3.5 h-3.5" /> },
  EXPIRED: { label: 'Expirado', variant: 'slate', icon: <AlertCircle className="w-3.5 h-3.5" /> },
}

// ─── Component ───────────────────────────────────────────────────────────

export default function AssinaturaPage() {
  const params = useParams()
  const { addToast } = useToast()

  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Form state
  const [tipoDocumento, setTipoDocumento] = useState('PROCURACAO')
  const [signers, setSigners] = useState([{ name: '', email: '' }])

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/cases/${params.id}/assinatura`)
      .then((r) => setAssinaturas(r.data.assinaturas))
      .catch(() => addToast({ type: 'error', title: 'Erro', message: 'Não foi possível carregar as assinaturas.' }))
      .finally(() => setLoading(false))
  }, [params.id, addToast])

  useEffect(() => { load() }, [load])

  const handleSend = async () => {
    // Validar campos
    for (const s of signers) {
      if (!s.name.trim() || !s.email.trim()) {
        addToast({ type: 'error', title: 'Campos obrigatórios', message: 'Preencha nome e email de todos os signatários.' })
        return
      }
    }

    setSending(true)
    try {
      // Gerar documento PDF de exemplo via HTML + jsPDF ou similar
      // O frontend envia o documento em base64
      // Nesta implementação, usamos um placeholder — em produção, gere o PDF real
      const docBase64 = await generateDocumentPlaceholder(tipoDocumento)

      const r = await api.post(`/cases/${params.id}/assinatura`, {
        tipoDocumento,
        documentoBase64: docBase64,
        signers: signers.map((s) => ({ name: s.name.trim(), email: s.email.trim() })),
      })

      addToast({
        type: 'success',
        title: 'Documento enviado',
        message: 'Documento enviado para assinatura com sucesso.',
      })

      setShowModal(false)
      setSigners([{ name: '', email: '' }])
      load()

      // Abrir link de assinatura em nova aba
      if (r.data.assinatura?.signUrl) {
        window.open(r.data.assinatura.signUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      addToast({
        type: 'error',
        title: 'Erro ao enviar',
        message: axiosError?.response?.data?.error ?? 'Não foi possível enviar o documento para assinatura.',
      })
    } finally {
      setSending(false)
    }
  }

  const handleDownload = async (assinaturaId: string) => {
    setDownloading(assinaturaId)
    try {
      const r = await api.get(`/cases/${params.id}/assinatura?download=${assinaturaId}`, {
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `documento-assinado-${assinaturaId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      addToast({ type: 'success', title: 'Download', message: 'Documento baixado com sucesso.' })
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível baixar o documento.' })
    } finally {
      setDownloading(null)
    }
  }

  const handleAddSigner = () => {
    setSigners([...signers, { name: '', email: '' }])
  }

  const handleRemoveSigner = (index: number) => {
    if (signers.length <= 1) return
    setSigners(signers.filter((_, i) => i !== index))
  }

  const handleSignerChange = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...signers]
    updated[index] = { ...updated[index], [field]: value }
    setSigners(updated)
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Assinatura Digital</h1>
          <p className="text-sm text-slate-500 mt-1">
            Envie documentos para assinatura eletrônica via Clicksign
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Send className="w-4 h-4 mr-2" />
          Novo Envio
        </Button>
      </div>

      {/* Lista de Assinaturas */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : assinaturas.length === 0 ? (
        <div className="text-center py-16">
          <FileSignature className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-sans font-medium text-slate-500">
            Nenhum documento enviado para assinatura.
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Clique em &quot;Novo Envio&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assinaturas.map((a) => {
            const statusCfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.PENDING
            return (
              <div
                key={a.id}
                className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {TIPO_DOCUMENTO_LABELS[a.tipoDocumento] ?? a.tipoDocumento}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={statusCfg.variant} className="flex items-center gap-1">
                        {statusCfg.icon}
                        {statusCfg.label}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {a.signers && Array.isArray(a.signers) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(a.signers as Array<{ name: string; email: string }>).map((s, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {s.name} ({s.email})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.status === 'PENDING' && a.signUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => a.signUrl && window.open(a.signUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Assinar
                    </Button>
                  )}
                  {a.status === 'SIGNED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={downloading === a.id}
                      onClick={() => handleDownload(a.id)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Novo Envio */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Enviar para Assinatura">
        <div className="space-y-4">
          {/* Tipo de Documento */}
          <div>
            <label className="block font-sans font-medium text-sm text-slate-700 mb-1">
              Tipo de Documento
            </label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="w-full px-3 py-2 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
            >
              <option value="PROCURACAO">Procuração</option>
              <option value="PETICAO">Petição Inicial</option>
              <option value="CONTRATO">Contrato de Honorários</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Selecione o tipo de documento. O PDF será gerado automaticamente.
            </p>
          </div>

          {/* Signatários */}
          <div>
            <label className="block font-sans font-medium text-sm text-slate-700 mb-2">
              Signatários
            </label>
            <div className="space-y-3">
              {signers.map((signer, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={signer.name}
                      onChange={(e) => handleSignerChange(i, 'name', e.target.value)}
                      className="w-full px-3 py-2 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={signer.email}
                      onChange={(e) => handleSignerChange(i, 'email', e.target.value)}
                      className="w-full px-3 py-2 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                    />
                  </div>
                  {signers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSigner(i)}
                      className="mt-1 p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddSigner}
              className="mt-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              + Adicionar signatário
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSend} loading={sending} className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Enviar para Assinatura
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Document Placeholder Generator ──────────────────────────────────────
// Em produção: gere o PDF real usando @react-pdf/renderer, jspdf, ou similar.
// Este placeholder cria um PDF mínimo válido para testes de fluxo.

async function generateDocumentPlaceholder(tipoDocumento: string): Promise<string> {
  const tipoLabel = TIPO_DOCUMENTO_LABELS[tipoDocumento] ?? tipoDocumento
  const title = `${tipoLabel} - Previando`
  const date = new Date().toLocaleDateString('pt-BR')

  // Cria um PDF mínimo em base64
  // Conteúdo simples em formato PDF válido
  const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 206>>stream
BT
/F1 18 Tf
50 700 Td
(${title}) Tj
/F1 11 Tf
50 660 Td
(Data: ${date}) Tj
50 640 Td
(Documento gerado pelo Previando para assinatura digital.) Tj
50 620 Td
(Tipo: ${tipoLabel}) Tj
ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000525 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
587
%%EOF`

  // Converter para base64
  const encoder = new TextEncoder()
  const uint8Array = encoder.encode(pdfContent)
  const binaryString = Array.from(uint8Array).map((b) => String.fromCodePoint(b)).join('')
  return btoa(binaryString)
}
