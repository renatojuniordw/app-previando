'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { useToast } from '@/store/toast'
import { formatCPF, formatPhone, stripNonDigits } from '@/lib/masks'
import { isValidCPF } from '@/lib/cpf'
import { AlertCircle, ArrowLeft, Search, Loader2, UserPlus, UserCheck } from 'lucide-react'

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const ESTADO_CIVIL = [
  { value: 'solteiro(a)', label: 'Solteiro(a)' },
  { value: 'casado(a)', label: 'Casado(a)' },
  { value: 'divorciado(a)', label: 'Divorciado(a)' },
  { value: 'viuvo(a)', label: 'Viúvo(a)' },
  { value: 'uniao estavel', label: 'União Estável' },
]

const GENERO = [
  { value: 'F', label: 'Feminino' },
  { value: 'M', label: 'Masculino' },
]

const formSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  cpf: z.string().optional().refine((v) => !v || isValidCPF(v), 'CPF inválido.'),
  birthDate: z.string().min(1, 'Data obrigatória'),
  gender: z.enum(['M', 'F']).optional().nullable(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  maritalStatus: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  streetNumber: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  priority: z.enum(['CRITICAL', 'ATTENTION', 'NORMAL']).default('NORMAL'),
})

type FormValues = z.infer<typeof formSchema>

interface ClientFormPageProps {
  clientId?: string
}

export function ClientFormPage({ clientId }: ClientFormPageProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const isEdit = !!clientId

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [phoneRaw, setPhoneRaw] = useState('')
  const [cepLoading, setCepLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) })

  useEffect(() => {
    if (!clientId) return
    api.get(`/clients/${clientId}`)
      .then((r) => {
        const c = r.data.client
        setPhoneRaw(stripNonDigits(c.phone ?? ''))
        reset({
          name: c.name ?? '',
          birthDate: c.birthDate ? c.birthDate.split('T')[0] : '',
          gender: c.gender ?? null,
          phone: formatPhone(stripNonDigits(c.phone ?? '')),
          email: c.email ?? '',
          maritalStatus: c.maritalStatus ?? '',
          profession: c.profession ?? '',
          street: c.street ?? '',
          streetNumber: c.streetNumber ?? '',
          complement: c.complement ?? '',
          neighborhood: c.neighborhood ?? '',
          city: c.city ?? '',
          state: c.state ?? '',
          zipCode: c.zipCode ?? '',
          priority: c.priority ?? 'NORMAL',
        })
      })
      .catch(() => {
        addToast({ type: 'error', title: 'Erro', message: 'Cliente não encontrado.' })
        router.push('/clients/list')
      })
      .finally(() => setLoading(false))
  }, [clientId, reset, addToast, router])

  const lookupCep = async (raw: string) => {
    if (raw.length !== 8) return
    setCepLoading(true)
    try {
      const r = await api.get('/cep', { params: { cep: raw } })
      setValue('street', r.data.street)
      setValue('neighborhood', r.data.neighborhood)
      setValue('city', r.data.city)
      setValue('state', r.data.state)
    } catch {
    } finally {
      setCepLoading(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (!isEdit && !data.cpf) {
      setError('CPF é obrigatório.')
      setSaving(false)
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        ...data,
        birthDate: new Date(data.birthDate).toISOString(),
        gender: data.gender || null,
        maritalStatus: data.maritalStatus || null,
        profession: data.profession || null,
        street: data.street || null,
        streetNumber: data.streetNumber || null,
        complement: data.complement || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
      }

      if (isEdit) {
        delete payload.cpf
        await api.put(`/clients/${clientId}`, payload)
        addToast({ type: 'success', title: 'Cliente atualizado' })
      } else {
        payload.cpf = stripNonDigits(data.cpf!)
        await api.post('/clients', payload)
        addToast({ type: 'success', title: 'Cliente cadastrado', message: `${data.name} foi adicionado à sua base.` })
      }
      router.push('/clients/list')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao salvar cliente.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
          {isEdit ? <UserCheck className="w-7 h-7 text-white" /> : <UserPlus className="w-7 h-7 text-white" />}
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
            <button onClick={() => router.push('/clients/list')} className="flex items-center gap-1 hover:text-amber-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Clientes
            </button>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">
            {isEdit ? 'Atualize as informações cadastrais do segurado.' : 'Cadastre um novo cliente preenchendo o formulário.'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl font-sans font-medium text-sm text-red-650 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Seção 1: Dados Pessoais */}
          <div className="space-y-5">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Informações Pessoais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Nome completo"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Ex: João da Silva"
              />

              {!isEdit ? (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="CPF"
                    value={watch('cpf') ?? ''}
                    onChange={(e) => {
                      const raw = stripNonDigits(e.target.value).slice(0, 11)
                      setValue('cpf', formatCPF(raw))
                    }}
                    error={errors.cpf?.message}
                    placeholder="000.000.000-00"
                  />
                  <DatePicker
                    label="Nascimento"
                    value={watch('birthDate') ?? ''}
                    onChange={(d: Date | null) => setValue('birthDate', d ? d.toISOString().split('T')[0] : '', { shouldValidate: true })}
                    error={errors.birthDate?.message}
                  />
                </div>
              ) : (
                <DatePicker
                  label="Data de nascimento"
                  value={watch('birthDate') ?? ''}
                  onChange={(d: Date | null) => setValue('birthDate', d ? d.toISOString().split('T')[0] : '', { shouldValidate: true })}
                  error={errors.birthDate?.message}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Telefone"
                value={formatPhone(phoneRaw)}
                onChange={(e) => {
                  const raw = stripNonDigits(e.target.value).slice(0, 11)
                  setPhoneRaw(raw)
                  setValue('phone', formatPhone(raw))
                }}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Estado Civil</label>
                <select
                  {...register('maritalStatus')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                >
                  <option value="">Selecione...</option>
                  {ESTADO_CIVIL.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
              <Input label="Profissão" {...register('profession')} placeholder="Ex: Metalúrgico, Aposentado" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Sexo</label>
                <select
                  {...register('gender')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                >
                  <option value="">Selecione...</option>
                  {GENERO.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Usado nas regras de aposentadoria (idade mínima difere por sexo).</p>
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço */}
          <div className="space-y-5">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Endereço Residencial
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="relative">
                <Input
                  label="CEP"
                  value={watch('zipCode') ?? ''}
                  onChange={(e) => {
                    const raw = stripNonDigits(e.target.value).slice(0, 8)
                    const masked = raw.replace(/^(\d{5})(\d)/, '$1-$2')
                    setValue('zipCode', masked)
                    if (raw.length === 8) lookupCep(raw)
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                  placeholder="00000-000"
                />
                {cepLoading && (
                  <Loader2 className="absolute right-3.5 top-[38px] w-4 h-4 text-amber-500 animate-spin" />
                )}
                {!cepLoading && stripNonDigits(watch('zipCode') ?? '').length === 8 && (
                  <Search className="absolute right-3.5 top-[38px] w-4 h-4 text-emerald-500" />
                )}
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Logradouro"
                  value={watch('street') ?? ''}
                  onChange={(e) => setValue('street', e.target.value)}
                  placeholder="Rua, Avenida, Alameda..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input label="Número" {...register('streetNumber')} placeholder="Ex: 123 ou S/N" />
              <Input label="Complemento" {...register('complement')} placeholder="Apto, Bloco, Casa..." />
              <Input
                label="Bairro"
                value={watch('neighborhood') ?? ''}
                onChange={(e) => setValue('neighborhood', e.target.value)}
                placeholder="Ex: Centro"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <Input
                  label="Cidade"
                  value={watch('city') ?? ''}
                  onChange={(e) => setValue('city', e.target.value)}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">UF</label>
                <select
                  value={watch('state') ?? ''}
                  onChange={(e) => setValue('state', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                >
                  <option value="">UF</option>
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Seção 3: Prioridade */}
          <div className="space-y-5">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Configurações Adicionais
            </h3>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Prioridade de Atendimento</label>
              <select 
                {...register('priority')} 
                className="w-full md:w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
              >
                <option value="NORMAL">Normal — Padrão</option>
                <option value="ATTENTION">Atenção — Prioridade Média</option>
                <option value="CRITICAL">Crítico — Prioridade Alta (Urgente)</option>
              </select>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/clients/list')} 
              className="flex-1 font-sans font-bold text-sm h-11"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              loading={saving} 
              className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-sans font-bold text-sm h-11 border-slate-900 shadow-sm transition-all"
            >
              {isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
