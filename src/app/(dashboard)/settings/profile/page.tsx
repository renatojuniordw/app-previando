'use client'

import { useToast } from '@/store/toast'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { formatCPF, stripNonDigits } from '@/lib/masks'

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
  const [saving, setSaving] = useState(false)

  const { addToast } = useToast()

  const handleSaveProfile = async () => {
    setSaving(true)
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
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível atualizar o perfil.' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { addToast({ type: 'error', title: 'Campos obrigatórios', message: 'Preencha a senha atual e a nova senha.' }); return }
    if (newPassword.length < 8) { addToast({ type: 'error', title: 'Senha inválida', message: 'Mínimo de 8 caracteres.' }); return }
    setSaving(true)
    try {
      await api.put('/users/password', { currentPassword, newPassword })
      addToast({ type: 'success', title: 'Senha alterada' })
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: unknown) {
      addToast({ type: 'error', title: 'Erro', message: (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao alterar senha.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ErrorBoundary>
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Perfil</h1>

      <Card variant="dark">
        <CardHeader title="Dados da Conta" />
        <div className="space-y-4">
          <div>
            <label className="neo-label">Email</label>
            <input
              value={session?.user?.email ?? ''}
              disabled
              className="neo-input opacity-50 cursor-not-allowed"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="OAB" value={oabNumber} onChange={(e) => setOabNumber(e.target.value)} placeholder="Ex: 123.456" />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
      </Card>

      <Card variant="dark">
        <CardHeader title="Dados Pessoais" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="neo-label">Estado Civil</label>
              <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="neo-input">
                <option value="">Selecione...</option>
                {ESTADO_CIVIL.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
            <Input label="Profissão" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Ex: Advogado" />
          </div>
        </div>
      </Card>

      <Card variant="dark">
        <CardHeader title="Endereço" />
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_120px] gap-4">
            <Input label="Logradouro" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua, Avenida..." />
            <Input label="Número" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} placeholder="S/N" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Complemento" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, Bloco..." />
            <Input label="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" />
          </div>
          <div className="grid grid-cols-[1fr_100px_120px] gap-4">
            <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
            <div>
              <label className="neo-label">UF</label>
              <select value={state} onChange={(e) => setState(e.target.value)} className="neo-input">
                <option value="">UF</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <Input label="CEP" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="00000-000" />
          </div>
          <Button onClick={handleSaveProfile} loading={saving}>Salvar Perfil</Button>
        </div>
      </Card>

      <Card variant="dark">
        <CardHeader title="Alterar Senha" />
        <div className="space-y-4">
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
            hint="Mínimo 8 caracteres, com maiúscula e número"
          />
          <Button onClick={handleChangePassword} loading={saving} variant="outline">
            Alterar Senha
          </Button>
        </div>
      </Card>

      <Card variant="dark">
        <CardHeader title="Plano Atual" />
        <div className="font-sans">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Plano</p>
          <p className="text-slate-900 text-xl font-bold mt-1">{session?.user?.plan ?? 'FREE'}</p>
          <p className="text-slate-500 text-sm mt-2">
            Para alterar o plano, acesse{' '}
            <a href="/settings/billing" className="text-amber-600 font-semibold hover:underline">
              Assinatura
            </a>
            .
          </p>
        </div>
      </Card>
    </div>
    </ErrorBoundary>
  )
}
