'use client'

import { useToast } from '@/store/toast'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AddressFields, type AddressValues } from '@/components/shared/AddressFields'
import { formatCPF, stripNonDigits } from '@/lib/masks'
import { ESTADO_CIVIL } from '@/lib/br-data'
import { User, Shield, CreditCard, CheckCircle2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// Common styling for native selects to match <Input> component
const selectClasses = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
const labelClasses = "block text-sm font-semibold text-slate-700 mb-1"

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState(session?.user?.name ?? '')
  const [oabNumber, setOabNumber] = useState(session?.user?.oabNumber ?? '')
  const [cpf, setCpf] = useState(session?.user?.cpf ?? '')
  const [phone, setPhone] = useState(session?.user?.phone ?? '')
  const [maritalStatus, setMaritalStatus] = useState(session?.user?.maritalStatus ?? '')
  const [profession, setProfession] = useState(session?.user?.profession ?? '')
  const [street, setStreet] = useState(session?.user?.street ?? '')
  const [streetNumber, setStreetNumber] = useState(session?.user?.streetNumber ?? '')
  const [complement, setComplement] = useState(session?.user?.complement ?? '')
  const [neighborhood, setNeighborhood] = useState(session?.user?.neighborhood ?? '')
  const [city, setCity] = useState(session?.user?.city ?? '')
  const [state, setState] = useState(session?.user?.state ?? '')
  const [zipCode, setZipCode] = useState(session?.user?.zipCode ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const { addToast } = useToast()

  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current || !session?.user) return
    hydrated.current = true
    setName(session.user.name ?? '')
    setOabNumber(session.user.oabNumber ?? '')
    setCpf(session.user.cpf ?? '')
    setPhone(session.user.phone ?? '')
    setMaritalStatus(session.user.maritalStatus ?? '')
    setProfession(session.user.profession ?? '')
    setStreet(session.user.street ?? '')
    setStreetNumber(session.user.streetNumber ?? '')
    setComplement(session.user.complement ?? '')
    setNeighborhood(session.user.neighborhood ?? '')
    setCity(session.user.city ?? '')
    setState(session.user.state ?? '')
    setZipCode(session.user.zipCode ?? '')
  }, [session])

  const addressValues: AddressValues = { street, streetNumber, complement, neighborhood, city, state, zipCode }
  const handleAddressChange = (field: keyof AddressValues, value: string) => {
    switch (field) {
      case 'street': setStreet(value); break
      case 'streetNumber': setStreetNumber(value); break
      case 'complement': setComplement(value); break
      case 'neighborhood': setNeighborhood(value); break
      case 'city': setCity(value); break
      case 'state': setState(value); break
      case 'zipCode': setZipCode(value); break
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const payload: Record<string, unknown> = { name }
      if (oabNumber) payload.oabNumber = oabNumber
      if (cpf) payload.cpf = cpf
      if (phone) payload.phone = phone
      if (maritalStatus) payload.maritalStatus = maritalStatus
      if (profession) payload.profession = profession
      if (street) payload.street = street
      if (streetNumber) payload.streetNumber = streetNumber
      if (complement) payload.complement = complement
      if (neighborhood) payload.neighborhood = neighborhood
      if (city) payload.city = city
      if (state) payload.state = state
      if (zipCode) payload.zipCode = zipCode
      await api.put('/users/profile', payload)
      await update()
      addToast({ type: 'success', title: 'Perfil atualizado' })
      // `update()` do next-auth nem sempre reflete os novos dados no client
      // de forma confiável (foi preciso deslogar/logar para ver a mudança em
      // testes manuais). Um reload garante que a sessão seja lida do zero.
      setTimeout(() => window.location.reload(), 600)
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível atualizar o perfil.' })
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { addToast({ type: 'error', title: 'Campos obrigatórios', message: 'Preencha a senha atual e a nova senha.' }); return }
    if (newPassword.length < 8) { addToast({ type: 'error', title: 'Senha inválida', message: 'Mínimo de 8 caracteres.' }); return }
    setSavingPassword(true)
    try {
      await api.put('/users/password', { currentPassword, newPassword })
      addToast({ type: 'success', title: 'Senha alterada' })
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: unknown) {
      addToast({ type: 'error', title: 'Erro', message: (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao alterar senha.' })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <ErrorBoundary>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Perfil</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Gerencie suas informações pessoais e configurações de segurança.</p>
          </div>
        </div>

        {/* Section: Dados da Conta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h3 className="text-base font-bold text-slate-900">Dados da Conta</h3>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              Informações principais de contato e identificação profissional.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
              <div>
                <label htmlFor="email" className={labelClasses}>Email</label>
                <input
                  id="email"
                  value={session?.user?.email ?? ''}
                  disabled
                  className={selectClasses}
                />
                <p className="text-xs text-slate-400 mt-1.5">O e-mail de acesso não pode ser alterado por aqui.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="OAB" value={oabNumber} onChange={(e) => setOabNumber(e.target.value)} placeholder="Ex: 123.456" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="CPF"
                  value={formatCPF(cpf)}
                  onChange={(e) => {
                    const raw = stripNonDigits(e.target.value).slice(0, 11)
                    setCpf(formatCPF(raw))
                  }}
                  placeholder="000.000.000-00"
                />
                <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section: Dados Pessoais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h3 className="text-base font-bold text-slate-900">Dados Pessoais</h3>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              Usados para o preenchimento automático de peças e documentos.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="maritalStatus" className={labelClasses}>Estado Civil</label>
                  <select id="maritalStatus" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className={selectClasses}>
                    <option value="">Selecione...</option>
                    {ESTADO_CIVIL.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
                <Input label="Profissão" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Ex: Advogado" />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section: Endereço */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <h3 className="text-base font-bold text-slate-900">Endereço Profissional</h3>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              O endereço que aparecerá nos cabeçalhos das suas procurações e contratos.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
              <AddressFields values={addressValues} onChange={handleAddressChange} />
            </div>
          </div>
        </div>

        {/* Save bar: applies to Dados da Conta, Dados Pessoais e Endereço acima */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1 hidden md:block" />
          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-4 bg-amber-50/60 border border-amber-200 rounded-xl px-5 py-4">
              <p className="text-sm text-slate-600">
                Salva as alterações de <span className="font-semibold">Dados da Conta</span>,{' '}
                <span className="font-semibold">Dados Pessoais</span> e{' '}
                <span className="font-semibold">Endereço</span>.
              </p>
              <Button onClick={handleSaveProfile} loading={savingProfile} className="shrink-0">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section: Segurança */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1 flex items-start gap-3">
            <div className="mt-0.5">
              <Shield className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Segurança</h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Atualize sua senha para manter sua conta protegida.
              </p>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
              <Input
                label="Senha atual"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                label="Nova senha"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                hint="Mínimo de 8 caracteres. Recomendamos usar letras, números e símbolos."
              />
              <div className="pt-2 flex justify-end">
                <Button onClick={handleChangePassword} loading={savingPassword} variant="outline">
                  Alterar Senha
                </Button>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section: Assinatura */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pb-10">
          <div className="md:col-span-1 flex items-start gap-3">
            <div className="mt-0.5">
              <CreditCard className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Plano Atual</h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Gerencie sua assinatura e métodos de pagamento.
              </p>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status do Plano</p>
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider ${
                    session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {session?.user?.plan ?? 'FREE'}
                  </span>
                  {(session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM') && (
                    <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Ativo
                    </span>
                  )}
                </div>
              </div>
              <Link 
                href="/settings/billing"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Gerenciar Assinatura
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </ErrorBoundary>
  )
}
