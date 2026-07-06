'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { maskCPF } from '@/lib/sanitize'
import { formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BENEFIT_SHORT_LABELS, STATUS_LABELS, PRIORITY_LABELS, BENEFIT_DB_LABELS } from '@/lib/constants'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ClientFloatingActions } from '@/components/client/ClientFloatingActions'
import { ClientPortalCard } from '@/components/client/ClientPortalCard'
import { ClientCnisCard } from '@/components/client/ClientCnisCard'
import { Briefcase, Clock, CheckCircle, ArrowLeft, User, FileText, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  maritalStatus: string | null
  profession: string | null
  street: string | null
  streetNumber: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zipCode: string | null
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
  const router = useRouter()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [creatingCase, setCreatingCase] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesText, setNotesText] = useState('')
  const { addToast } = useToast()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CaseForm>({
    resolver: zodResolver(caseSchema),
  })

  const loadClient = useCallback(() => {
    setLoading(true)
    api.get(`/clients/${params.id}`)
      .then((r) => setClient(r.data.client))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    loadClient()
  }, [loadClient])

  const createCase = async (data: CaseForm) => {
    setCreatingCase(true)
    try {
      await api.post('/cases', { clientId: params.id, ...data })
      setShowCaseModal(false)
      reset()
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
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
        <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-serif font-bold text-slate-850 text-base">Cliente não encontrado</h3>
        <p className="font-sans text-slate-500 text-sm mt-1">Este registro pode ter sido excluído ou não existe.</p>
        <button onClick={() => router.push('/clients/list')} className="mt-4 font-sans font-bold text-xs text-amber-600 hover:underline">
          Voltar à lista de clientes
        </button>
      </div>
    )
  }

  const totalCases = client.cases.length
  const finishedCases = client.cases.filter(c => ['FINISHED', 'FINALIZADO'].includes(c.status.toUpperCase())).length
  const activeCases = totalCases - finishedCases

  return (
    <ErrorBoundary>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0 text-white font-serif font-bold text-xl">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                <Link href="/clients/list" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Clientes
                </Link>
              </div>
              <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">{client.name}</h1>
              <p className="font-sans text-sm text-slate-550 mt-0.5 font-medium">CPF: {maskCPF(client.cpf)}</p>
            </div>
          </div>
        </div>

        {/* Informações Pessoais */}
        <Card variant="light" className="p-6 border-slate-200/80">
          <h2 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-3 mb-4">
            Dados do Segurado
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm font-sans">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data de Nascimento</span>
              <p className="text-slate-800 font-semibold mt-1">{formatDate(client.birthDate)}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefone</span>
              <p className="text-slate-800 font-semibold mt-1">{client.phone ?? '—'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</span>
              <p className="text-slate-800 font-semibold mt-1 truncate">{client.email ?? '—'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado Civil</span>
              <p className="text-slate-800 font-semibold mt-1">
                {client.maritalStatus ? client.maritalStatus.charAt(0).toUpperCase() + client.maritalStatus.slice(1) : '—'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profissão</span>
              <p className="text-slate-800 font-semibold mt-1">{client.profession ?? '—'}</p>
            </div>
            <div className="lg:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Endereço Completo</span>
              <p className="text-slate-800 font-semibold mt-1 leading-relaxed">
                {[client.street, client.streetNumber].filter(Boolean).join(', ')}
                {client.complement ? ` - ${client.complement}` : ''}
                {client.neighborhood ? `, ${client.neighborhood}` : ''}
                {client.city ? `, ${client.city}` : ''}
                {client.state ? ` - ${client.state}` : ''}
                {client.zipCode ? `, CEP ${client.zipCode}` : ''}
                {![client.street, client.city].some(Boolean) && '—'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prioridade</span>
              <div className="mt-1">
                <Badge variant={client.priority === 'CRITICAL' ? 'red' : client.priority === 'ATTENTION' ? 'yellow' : 'slate'}>
                  {PRIORITY_LABELS[client.priority] ?? client.priority}
                </Badge>
              </div>
            </div>
          </div>

          {client.notes && (
            <div className="mt-6 p-4 border border-slate-200/80 bg-slate-50/50 rounded-xl font-sans text-xs text-slate-700 leading-relaxed font-medium">
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Observações Internas</span>
              {client.notes}
            </div>
          )}
        </Card>

        {/* CNIS do Segurado */}
        <ClientCnisCard clientId={client.id} caseCount={totalCases} />

        {/* Resumo de Casos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-250 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total de Casos</p>
              <p className="font-mono font-bold text-2xl text-slate-900 mt-0.5">{totalCases}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider">Em Andamento</p>
              <p className="font-mono font-bold text-2xl text-slate-900 mt-0.5">{activeCases}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider">Finalizados</p>
              <p className="font-mono font-bold text-2xl text-slate-900 mt-0.5">{finishedCases}</p>
            </div>
          </div>
        </div>

        {/* Portal do Cliente */}
        <ClientPortalCard cases={client.cases} />

        {/* Casos / Processos */}
        <Card variant="light" className="p-6 border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-serif font-bold text-lg text-slate-900">
              Processos Vinculados ({client.cases.length})
            </h2>
            <Button size="sm" onClick={() => setShowCaseModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white border-slate-900 h-9 font-sans font-bold text-xs shadow-sm">
              + Adicionar Processo
            </Button>
          </div>

          {client.cases.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/20 rounded-xl">
              <FileText className="w-8 h-8 text-slate-350 mx-auto mb-2" />
              <p className="font-sans text-slate-500 text-sm font-medium">Nenhum caso cadastrado para este cliente.</p>
              <Button size="sm" onClick={() => setShowCaseModal(true)} className="mt-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8">
                Criar Caso
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {client.cases.map((caso) => (
                <Link key={caso.id} href={`/cases/${caso.id}`} className="block">
                  <div className="border border-slate-200 bg-white rounded-xl p-4.5 hover:border-slate-300 hover:shadow-md transition-all duration-300 flex items-center justify-between group shadow-sm">
                    <div className="space-y-1">
                      <p className="font-serif font-bold text-sm text-slate-800 group-hover:text-amber-700 transition-colors">
                        {BENEFIT_DB_LABELS[caso.benefitType] ?? BENEFIT_SHORT_LABELS[caso.benefitType] ?? caso.benefitType}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Criado em: {formatDate(caso.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {caso.cnisDocument && (
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-extrabold uppercase tracking-wider',
                          ['PROCESSED', 'PROCESSADO'].includes(caso.cnisDocument.processingStatus.toUpperCase()) 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100/60' 
                            : 'bg-amber-50 text-amber-700 border-amber-100/60'
                        )}>
                          CNIS {['PROCESSED', 'PROCESSADO'].includes(caso.cnisDocument.processingStatus.toUpperCase()) ? 'Lido' : 'Pendente'}
                        </span>
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
                      <ChevronRight className="w-4 h-4 text-slate-350 group-hover:text-slate-700 transition-colors ml-1 shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Modal Novo Caso */}
        <Modal open={showCaseModal} onClose={() => setShowCaseModal(false)} title="Novo Processo">
          <form onSubmit={handleSubmit(createCase)} className="space-y-5">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Tipo de Benefício</label>
              <select 
                {...register('benefitType')} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
              >
                <option value="">Selecione...</option>
                {Object.entries(BENEFIT_SHORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.benefitType && (
                <p className="mt-1 font-sans text-xs text-red-500 font-medium">{errors.benefitType.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Prioridade</label>
              <select 
                {...register('priority')} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
              >
                <option value="NORMAL">Normal — Padrão</option>
                <option value="ATTENTION">Atenção — Prioridade Média</option>
                <option value="CRITICAL">Crítico — Prioridade Alta (Urgente)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Observações</label>
              <textarea
                {...register('notes')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all min-h-[90px] resize-none"
                placeholder="Detalhes adicionais do caso..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCaseModal(false)} className="flex-1 font-sans font-bold text-xs h-10">Cancelar</Button>
              <Button type="submit" loading={creatingCase} className="flex-1 bg-slate-900 hover:bg-slate-850 border-slate-900 font-sans font-bold text-xs h-10 shadow-sm text-white">Criar Caso</Button>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all min-h-[140px] resize-none"
                placeholder="Digite observações importantes sobre este cliente..."
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowNotesModal(false)} className="flex-1 font-sans font-bold text-xs h-10">Cancelar</Button>
              <Button type="submit" loading={editingNotes} className="flex-1 bg-slate-900 hover:bg-slate-850 border-slate-900 font-sans font-bold text-xs h-10 shadow-sm text-white">Salvar</Button>
            </div>
          </form>
        </Modal>

        <ClientFloatingActions
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
