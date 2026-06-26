'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { maskCPF } from '@/lib/sanitize'
import { formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BENEFIT_SHORT_LABELS, STATUS_LABELS, PRIORITY_LABELS, BENEFIT_DB_LABELS } from '@/lib/constants'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ClientFloatingActions } from '@/components/client/ClientFloatingActions'

const getCaseStatusLabel = (status: string) => {
  const dbToLabel: Record<string, string> = {
    PROSPECTING: 'Prospecção',
    ANALYSIS: 'Análise',
    READY_TO_REQUEST: 'Pronto p/ Requerer',
    PROCESSING: 'Em Processamento',
    FINISHED: 'Finalizado',
  }
  return dbToLabel[status] ?? STATUS_LABELS[status] ?? status
}

interface ClientDetail {
  id: string
  name: string
  cpf: string
  birthDate: string
  phone: string | null
  email: string | null
  priority: string
  notes: string | null
  cases: Array<{
    id: string
    status: string
    benefitType: string
    priority: string
    createdAt: string
    cnisDocument?: { processingStatus: string } | null
  }>
}



const caseSchema = z.object({
  benefitType: z.string().min(1, 'Selecione o tipo de benefício'),
  priority: z.enum(['CRITICAL', 'ATTENTION', 'NORMAL']).default('NORMAL'),
  notes: z.string().optional(),
})
type CaseForm = z.infer<typeof caseSchema>

export default function ClientDetailPage() {
  const params = useParams()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [creatingCase, setCreatingCase] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesText, setNotesText] = useState('')
  const { addToast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<CaseForm>({
    resolver: zodResolver(caseSchema),
  })

  useEffect(() => {
    api.get(`/clients/${params.id}`)
      .then((r) => setClient(r.data.client))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [params.id])

  const createCase = async (data: CaseForm) => {
    setCreatingCase(true)
    try {
      await api.post('/cases', { clientId: params.id, ...data })
      setShowCaseModal(false)
      addToast({ type: 'success', title: 'Caso criado', message: 'Novo caso vinculado ao cliente.' })
      const r = await api.get(`/clients/${params.id}`)
      setClient(r.data.client)
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível criar o caso.' })
    } finally {
      setCreatingCase(false)
    }
  }

  const saveNotes = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditingNotes(true)
    try {
      await api.put(`/clients/${params.id}`, { notes: notesText })
      setShowNotesModal(false)
      addToast({ type: 'success', title: 'Sucesso', message: 'Observações atualizadas.' })
      const r = await api.get(`/clients/${params.id}`)
      setClient(r.data.client)
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível atualizar as observações.' })
    } finally {
      setEditingNotes(false)
    }
  }

  const handleCopyCpf = (cpf: string) => {
    navigator.clipboard.writeText(cpf.replace(/\D/g, ''))
    addToast({ type: 'success', title: 'Copiado', message: 'CPF copiado.' })
  }


  if (loading) {
    return <div className="p-8 font-sans font-medium text-slate-500 animate-pulse">Carregando...</div>
  }

  if (!client) {
    return <div className="p-8 font-sans text-slate-500">Cliente não encontrado.</div>
  }

  const totalCases = client.cases.length
  const finishedCases = client.cases.filter(c => ['FINISHED', 'FINALIZADO'].includes(c.status.toUpperCase())).length
  const activeCases = totalCases - finishedCases

  return (
    <ErrorBoundary>
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/clients/list" className="font-sans text-sm font-medium text-slate-500 hover:text-slate-900">
              ← Clientes
            </Link>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">{client.name}</h1>
          <p className="font-sans text-sm text-slate-500 font-medium">CPF: {maskCPF(client.cpf)}</p>
        </div>
      </div>

      {/* Dados do cliente */}
      <Card variant="dark">
        <CardHeader title="Dados do Segurado" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-sans">
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Data de nascimento</span>
            <p className="text-slate-900 font-medium">{formatDate(client.birthDate)}</p>
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Telefone</span>
            <p className="text-slate-900 font-medium">{client.phone ?? '—'}</p>
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Email</span>
            <p className="text-slate-900 font-medium">{client.email ?? '—'}</p>
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Prioridade</span>
            <div className="mt-0.5">
              <Badge variant={client.priority === 'CRITICAL' ? 'red' : client.priority === 'ATTENTION' ? 'yellow' : 'slate'}>
                {PRIORITY_LABELS[client.priority] ?? client.priority}
              </Badge>
            </div>
          </div>
        </div>
        {client.notes && (
          <div className="mt-4 p-3 border border-slate-200 bg-slate-50 rounded-md font-sans text-sm text-slate-700">
            {client.notes}
          </div>
        )}
      </Card>

      {/* Resumo de Casos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-sans uppercase tracking-wide text-slate-500 font-semibold">Total de Casos</p>
          <p className="text-3xl font-serif font-bold text-slate-900 mt-1">{totalCases}</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-sans uppercase tracking-wide text-blue-700 font-semibold">Em Andamento</p>
          <p className="text-3xl font-serif font-bold text-blue-900 mt-1">{activeCases}</p>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-sans uppercase tracking-wide text-emerald-700 font-semibold">Finalizados</p>
          <p className="text-3xl font-serif font-bold text-emerald-900 mt-1">{finishedCases}</p>
        </Card>
      </div>

      {/* Casos */}
      <Card variant="dark">
        <CardHeader
          title={`Casos (${client.cases.length})`}
          action={
            <Button size="sm" onClick={() => setShowCaseModal(true)}>
              + Caso
            </Button>
          }
        />

        {client.cases.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-300 bg-slate-50 rounded-lg">
            <p className="font-sans text-slate-500 text-sm">Nenhum caso criado.</p>
            <Button size="sm" onClick={() => setShowCaseModal(true)} className="mt-3">
              + Criar Caso
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {client.cases.map((caso) => (
              <Link key={caso.id} href={`/cases/${caso.id}`}>
                <div className="border border-slate-200 bg-white rounded-md p-3 hover:border-amber-600 shadow-sm transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans font-semibold text-sm text-slate-900">
                        {BENEFIT_DB_LABELS[caso.benefitType] ?? BENEFIT_SHORT_LABELS[caso.benefitType] ?? caso.benefitType}
                      </p>
                      <p className="font-sans text-sm text-slate-500">
                        {formatDate(caso.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {caso.cnisDocument && (
                        <Badge variant={['PROCESSED', 'PROCESSADO'].includes(caso.cnisDocument.processingStatus.toUpperCase()) ? 'lime' : 'yellow'}>
                          CNIS {['PROCESSED', 'PROCESSADO'].includes(caso.cnisDocument.processingStatus.toUpperCase()) ? '✅' : '⏳'}
                        </Badge>
                      )}
                      <Badge variant={caso.priority === 'CRITICAL' ? 'red' : caso.priority === 'ATTENTION' ? 'yellow' : 'slate'}>
                        {PRIORITY_LABELS[caso.priority] ?? caso.priority}
                      </Badge>
                      <Badge 
                        variant={
                          ['PROSPECTING', 'PROSPECCAO'].includes(caso.status.toUpperCase()) ? 'slate' :
                          ['ANALYSIS', 'ANALISE'].includes(caso.status.toUpperCase()) ? 'blue' :
                          ['READY_TO_REQUEST', 'PRONTO_PARA_REQUERER'].includes(caso.status.toUpperCase()) ? 'yellow' :
                          ['PROCESSING', 'EM_PROCESSAMENTO'].includes(caso.status.toUpperCase()) ? 'lime' :
                          ['FINISHED', 'FINALIZADO'].includes(caso.status.toUpperCase()) ? 'green' : 'slate'
                        }
                      >
                        {getCaseStatusLabel(caso.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Novo Caso */}
      <Modal open={showCaseModal} onClose={() => setShowCaseModal(false)} title="Novo Caso">
        <form onSubmit={handleSubmit(createCase)} className="space-y-4">
          <div>
            <label className="neo-label">Tipo de Benefício</label>
            <select {...register('benefitType')} className="neo-input">
              <option value="">Selecione...</option>
              {Object.entries(BENEFIT_SHORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.benefitType && (
              <p className="mt-1 font-sans text-xs text-red-500">{errors.benefitType.message}</p>
            )}
          </div>
          <div>
            <label className="neo-label">Prioridade</label>
            <select {...register('priority')} className="neo-input">
              <option value="NORMAL">Normal</option>
              <option value="ATTENTION">Atenção</option>
              <option value="CRITICAL">Crítico</option>
            </select>
          </div>
          <div>
            <label className="neo-label">Observações</label>
            <textarea
              {...register('notes')}
              className="neo-input min-h-[80px] resize-none"
              placeholder="Detalhes do caso..."
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={creatingCase} className="flex-1">Criar</Button>
            <Button type="button" variant="outline" onClick={() => setShowCaseModal(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Notas */}
      <Modal open={showNotesModal} onClose={() => setShowNotesModal(false)} title="Editar Observações">
        <form onSubmit={saveNotes} className="space-y-4">
          <div>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="neo-input min-h-[120px] resize-none"
              placeholder="Digite as observações do cliente..."
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={editingNotes} className="flex-1">Salvar</Button>
            <Button type="button" variant="outline" onClick={() => setShowNotesModal(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </Modal>

      <ClientFloatingActions 
        phone={client.phone} 
        email={client.email} 
        cpf={client.cpf}
        onEdit={() => {
          setNotesText(client.notes || '')
          setShowNotesModal(true)
        }}
        onCopyCpf={handleCopyCpf}
      />
    </div>
    </ErrorBoundary>
  )
}
