'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { useToast } from '@/store/toast'
import { formatCEP, formatCPF, formatPhone, stripNonDigits } from '@/lib/masks'
import { isValidCPF } from '@/lib/cpf'
import { useCepLookup } from '@/hooks/useCepLookup'
import { ESTADOS, ESTADO_CIVIL } from '@/lib/br-data'
import { AlertCircle, ArrowLeft, UserPlus, UserCheck } from 'lucide-react'

const GENERO = [
  { value: 'F', label: 'Feminino' },
  { value: 'M', label: 'Masculino' },
]

const formSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  cpf: z
    .string()
    .min(11, 'CPF é obrigatório')
    .refine((v) => isValidCPF(v), 'CPF inválido.'),
  birthDate: z.string().min(1, 'Data obrigatória'),
  gender: z.preprocess(
    (v) => (v === '' ? null : v),
    z.enum(['M', 'F'], {
      errorMap: () => ({ message: 'Escolha uma opção de sexo válida.' }),
    })
      .nullable()
      .optional()
  ),
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? formSchema.omit({ cpf: true }) : formSchema),
    mode: 'onTouched',
    defaultValues: { cpf: '' },
  })

  const isDirty = Object.keys(dirtyFields).length > 0

  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const handleCancel = () => {
    if (isDirty && !window.confirm('Há alterações não salvas. Deseja realmente sair?')) return
    router.push('/clients/list')
  }

  const isFieldSuccess = (fieldName: keyof FormValues) => {
    return !!touchedFields[fieldName] && !errors[fieldName] && !!watch(fieldName)
  }

  useEffect(() => {
    if (!clientId) return
    api
      .get(`/clients/${clientId}`)
      .then((r) => {
        const c = r.data.client
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

  const { cepLoading, lookupCep } = useCepLookup((address) => {
    setValue('street', address.street, { shouldValidate: true, shouldTouch: true })
    setValue('neighborhood', address.neighborhood, { shouldValidate: true, shouldTouch: true })
    setValue('city', address.city, { shouldValidate: true, shouldTouch: true })
    setValue('state', address.state, { shouldValidate: true, shouldTouch: true })
  })

  const onSubmit = async (data: FormValues) => {
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
        payload.cpf = stripNonDigits(data.cpf)
        await api.post('/clients', payload)
        addToast({
          type: 'success',
          title: 'Cliente cadastrado',
          message: `${data.name} foi adicionado à sua base.`,
        })
      }
      router.push('/clients/list')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Erro ao salvar cliente.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-6 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
          {isEdit ? (
            <UserCheck className="h-7 w-7 text-white" />
          ) : (
            <UserPlus className="h-7 w-7 text-white" />
          )}
        </div>
        <div>
          <div className="mb-0.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 transition-colors hover:text-amber-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Clientes
            </button>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="mt-0.5 font-sans text-sm font-medium text-slate-500">
            {isEdit
              ? 'Atualize as informações cadastrais do segurado.'
              : 'Cadastre um novo cliente preenchendo o formulário.'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 p-6 sm:p-8"
        >
          {error && (
            <div className="text-red-650 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 font-sans text-sm font-medium">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p>{error}</p>
            </div>
          )}

          {/* Seção 1: Dados Pessoais */}
          <div className="space-y-5">
            <h3 className="border-b border-slate-100 pb-2 font-serif text-base font-bold text-slate-900">
              Informações Pessoais
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input
                label="Nome completo"
                {...register('name')}
                error={errors.name?.message}
                success={isFieldSuccess('name')}
                placeholder="Ex: João da Silva"
              />

              <DatePicker
                label="Data de nascimento"
                value={watch('birthDate') ?? ''}
                onChange={(d: Date | null) =>
                  setValue('birthDate', d ? d.toISOString().split('T')[0] : '', {
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
                error={errors.birthDate?.message}
                success={isFieldSuccess('birthDate')}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {!isEdit ? (
                <Input
                  label="CPF"
                  {...register('cpf', {
                    onChange: (e) => {
                      const raw = stripNonDigits(e.target.value).slice(0, 11)
                      setValue('cpf', formatCPF(raw), { shouldValidate: true })
                    },
                  })}
                  error={errors.cpf?.message}
                  success={isFieldSuccess('cpf')}
                  placeholder="000.000.000-00"
                />
              ) : (
                <div />
              )}
              <Input
                label="Telefone"
                {...register('phone', {
                  onChange: (e) => {
                    const raw = stripNonDigits(e.target.value).slice(0, 11)
                    setValue('phone', formatPhone(raw), { shouldValidate: true })
                  },
                })}
                error={errors.phone?.message}
                success={isFieldSuccess('phone')}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Select
                label="Estado Civil"
                {...register('maritalStatus')}
                error={errors.maritalStatus?.message}
                success={isFieldSuccess('maritalStatus')}
              >
                <option value="">Selecione...</option>
                {ESTADO_CIVIL.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Sexo"
                {...register('gender')}
                error={errors.gender?.message}
                success={isFieldSuccess('gender')}
                hint="Usado nas regras de aposentadoria (idade mínima difere por sexo)."
              >
                <option value="">Selecione...</option>
                {GENERO.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Profissão"
                {...register('profession')}
                error={errors.profession?.message}
                success={isFieldSuccess('profession')}
                placeholder="Ex: Metalúrgico"
              />
            </div>

            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              success={isFieldSuccess('email')}
              placeholder="email@exemplo.com"
            />
          </div>

          {/* Seção 2: Endereço */}
          <div className="space-y-5">
            <h3 className="border-b border-slate-100 pb-2 font-serif text-base font-bold text-slate-900">
              Endereço Residencial
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Input
                label="CEP"
                {...register('zipCode', {
                  onChange: (e) => {
                    const raw = stripNonDigits(e.target.value).slice(0, 8)
                    setValue('zipCode', formatCEP(raw), { shouldValidate: true })
                    if (raw.length === 8) lookupCep(raw)
                  },
                })}
                error={errors.zipCode?.message}
                success={
                  isFieldSuccess('zipCode') && stripNonDigits(watch('zipCode') ?? '').length === 8
                }
                loading={cepLoading}
                placeholder="00000-000"
              />

              <div className="md:col-span-2">
                <Input
                  label="Logradouro"
                  {...register('street')}
                  error={errors.street?.message}
                  success={isFieldSuccess('street')}
                  placeholder="Rua, Avenida, Alameda..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Input
                label="Número"
                {...register('streetNumber')}
                error={errors.streetNumber?.message}
                success={isFieldSuccess('streetNumber')}
                placeholder="Ex: 123 ou S/N"
              />
              <Input
                label="Complemento"
                {...register('complement')}
                error={errors.complement?.message}
                success={isFieldSuccess('complement')}
                placeholder="Apto, Bloco, Casa..."
              />
              <Input
                label="Bairro"
                {...register('neighborhood')}
                error={errors.neighborhood?.message}
                success={isFieldSuccess('neighborhood')}
                placeholder="Ex: Centro"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="md:col-span-2">
                <Input
                  label="Cidade"
                  {...register('city')}
                  error={errors.city?.message}
                  success={isFieldSuccess('city')}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <Select
                label="UF"
                {...register('state')}
                error={errors.state?.message}
                success={isFieldSuccess('state')}
              >
                <option value="">UF</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Prioridade + Ações */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div>
                <p className="font-sans text-sm font-bold text-slate-800">Prioridade de Atendimento</p>
                <p className="font-sans text-xs text-slate-500">Define a urgência do cliente na sua lista.</p>
              </div>
              <Select
                {...register('priority')}
                wrapperClassName="w-full sm:w-56"
              >
                <option value="NORMAL">Normal</option>
                <option value="ATTENTION">Atenção</option>
                <option value="CRITICAL">Crítico</option>
              </Select>
            </div>

            <div className="flex gap-4 border-t border-slate-100 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="h-11 flex-1 font-sans text-sm font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={saving}
                className="hover:bg-slate-850 h-11 flex-1 border-slate-900 bg-slate-900 font-sans text-sm font-bold text-white shadow-sm transition-all"
              >
                {isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
