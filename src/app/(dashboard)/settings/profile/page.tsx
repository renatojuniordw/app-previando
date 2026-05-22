'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader } from '@/components/ui/Card'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [name, setName] = useState(session?.user?.name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSaveName = async () => {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await api.put('/users/profile', { name })
      setMessage('Nome atualizado com sucesso.')
    } catch {
      setError('Erro ao atualizar nome.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { setError('Preencha todos os campos.'); return }
    if (newPassword.length < 8) { setError('Nova senha: mínimo 8 caracteres.'); return }
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await api.put('/users/password', { currentPassword, newPassword })
      setMessage('Senha alterada com sucesso.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao alterar senha.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Perfil</h1>

      {message && (
        <div className="border border-green-200 bg-green-50 rounded-md p-3">
          <p className="font-sans text-sm font-medium text-green-700">✓ {message}</p>
        </div>
      )}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-md p-3">
          <p className="font-sans text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

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
          <div>
            <label className="neo-label">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="neo-input"
              placeholder="Seu nome"
            />
          </div>
          <Button onClick={handleSaveName} loading={saving}>Salvar Nome</Button>
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
            hint="Mínimo 8 caracteres"
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
  )
}
