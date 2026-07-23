'use client'

import { Copy, Mail, Zap } from 'lucide-react'
import { FloatingActionMenu, type FloatingAction } from '@/components/ui/FloatingActionMenu'

interface ClientFloatingActionsProps {
  email?: string | null
  cpf: string
  onCopyCpf: (cpf: string) => void
}

export function ClientFloatingActions({ email, cpf, onCopyCpf }: ClientFloatingActionsProps) {
  const actions: FloatingAction[] = [
    {
      id: 'copy',
      label: 'Copiar CPF',
      icon: <Copy className="w-4 h-4" />,
      color: 'hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 text-slate-600',
      onClick: () => onCopyCpf(cpf),
      show: !!cpf,
    },
    {
      id: 'email',
      label: 'Enviar E-mail',
      icon: <Mail className="w-4 h-4" />,
      color: 'hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50 text-slate-600',
      onClick: () => { window.location.href = `mailto:${email}` },
      show: !!email,
    },
  ]

  return (
    <FloatingActionMenu
      actions={actions}
      triggerColor="bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20"
      triggerIcon={<Zap className="w-5 h-5" />}
      triggerLabel="Ações rápidas do cliente"
    />
  )
}
