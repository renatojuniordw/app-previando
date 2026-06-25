'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { ClientSwitcher } from '@/components/ClientSwitcher'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { maskCPF } from '@/lib/sanitize'
import { formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/store/toast'
import { Search, Plus, MoreHorizontal, User, FileText, Phone, Mail, AlertCircle } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface Client {
  id: string
  name: string
  cpf: string
  phone: string | null
  email: string | null
  priority: 'CRITICAL' | 'ATTENTION' | 'NORMAL'
  cases: Array<{ id: string; status: string; benefitType: string }>
  createdAt: string
}

const PRIORITY_BADGE: Record<string, 'red' | 'yellow' | 'slate'> = {
  CRITICAL: 'red',
  ATTENTION: 'yellow',
  NORMAL: 'slate',
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítico',
  ATTENTION: 'Atenção',
  NORMAL: 'Normal',
}

const createSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  birthDate: z.string().min(1, 'Data obrigatória'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  priority: z.enum(['CRITICAL', 'ATTENTION', 'NORMAL']).default('NORMAL'),
})

type CreateForm = z.infer<typeof createSchema>

export default function ClientsListPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) })

  const load = (q?: string) => {
    setLoading(true)
    api.get('/clients', { params: { search: q, limit: 50 } })
      .then((r) => {
        setClients(r.data.clients)
        setTotal(r.data.total)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    load(e.target.value)
  }

  const onSubmit = async (data: CreateForm) => {
    setCreating(true)
    setError('')
    try {
      await api.post('/clients', {
        ...data,
        birthDate: new Date(data.birthDate).toISOString(),
      })
      setShowModal(false)
      reset()
      addToast({ type: 'success', title: 'Cliente cadastrado', message: `${data.name} foi adicionado à sua base.` })
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao criar cliente.'
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <ErrorBoundary>
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Clientes</h1>
          <p className="font-sans text-sm text-slate-500 mt-1 font-medium">{total} clientes cadastrados na sua base</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Buscar por nome ou CPF..."
              aria-label="Buscar clientes"
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400 text-slate-900 shadow-sm"
            />
          </div>
          <Button onClick={() => setShowModal(true)} className="shrink-0 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white border-amber-600">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <ClientSwitcher />
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full"></div>
            <p className="font-sans font-medium text-slate-500 animate-pulse mt-4">Carregando clientes...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <User className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-sans text-slate-900 font-semibold text-lg">Nenhum cliente encontrado</p>
            <p className="font-sans text-slate-500 text-sm mt-1 max-w-sm">
              Comece adicionando seu primeiro cliente para gerenciar casos e documentos.
            </p>
            <Button onClick={() => setShowModal(true)} className="mt-6 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white border-amber-600">
              <Plus className="w-4 h-4" />
              Cadastrar Primeiro Cliente
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-4 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Prioridade</th>
                  <th className="px-6 py-4 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Casos Ativos</th>
                  <th className="px-6 py-4 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider">Cadastrado em</th>
                  <th className="px-6 py-4 font-sans font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-700 font-serif font-bold text-sm shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/clients/list/${client.id}`} className="font-sans font-semibold text-sm text-slate-900 hover:text-amber-600 transition-colors">
                            {client.name}
                          </Link>
                          <p className="font-sans text-xs text-slate-500 mt-0.5 font-medium">CPF: {maskCPF(client.cpf)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {client.phone ? (
                          <div className="flex items-center gap-1.5 font-sans text-xs text-slate-600 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {client.phone}
                          </div>
                        ) : (
                          <span className="font-sans text-xs text-slate-400">Sem telefone</span>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1.5 font-sans text-xs text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[120px]">{client.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={PRIORITY_BADGE[client.priority]}>
                        {PRIORITY_LABELS[client.priority]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-sans text-sm font-medium text-slate-700">{client.cases.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-sans text-sm text-slate-500 font-medium">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/clients/list/${client.id}`}>
                        <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Cliente">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg font-sans font-medium text-sm text-red-600 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nome completo"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Ex: João da Silva"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CPF"
              {...register('cpf')}
              error={errors.cpf?.message}
              placeholder="000.000.000-00"
            />
            <Input
              label="Data de nascimento"
              type="date"
              {...register('birthDate')}
              error={errors.birthDate?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="WhatsApp / Telefone"
              {...register('phone')}
              placeholder="(11) 99999-9999"
            />
            <Input
              label="Email (opcional)"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="neo-label">Prioridade de Atendimento</label>
            <select {...register('priority')} className="neo-input mt-1">
              <option value="NORMAL">Normal - Padrão</option>
              <option value="ATTENTION">Atenção - Prioridade Média</option>
              <option value="CRITICAL">Crítico - Prioridade Alta (Urgente)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-slate-300 text-slate-700">
              Cancelar
            </Button>
            <Button type="submit" loading={creating} className="flex-1 bg-amber-600 hover:bg-amber-700 border-amber-600 text-white">
              Cadastrar Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
    </ErrorBoundary>
  )
}
