'use client'

import { useToast } from '@/store/toast'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [name, setName] = useState(session?.user?.name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const { addToast } = useToast()

  const handleSaveName = async () => {
    setSaving(true)
    try {
      await api.put('/users/profile', { name })
      addToast({ type: 'success', title: 'Nome atualizado' })
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível atualizar o nome.' })
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
    <div className="space-y-6 max-w-lg">
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
    </ErrorBoundary>
  )
}
