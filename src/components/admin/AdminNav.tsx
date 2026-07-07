'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, CreditCard, Activity, Package, DollarSign, BookOpen, Tags, Headphones } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/payments', label: 'Pagamentos', icon: CreditCard },
  { href: '/admin/metrics', label: 'Métricas', icon: Activity },
  { href: '/admin/plans', label: 'Planos', icon: Package },
  { href: '/admin/salario-minimo', label: 'Salário Mínimo', icon: DollarSign },
  { href: '/admin/modalidades', label: 'Modalidades', icon: Tags },
  { href: '/admin/regras-aposentadoria', label: 'Regras Previdenciárias', icon: BookOpen },
  { href: '/admin/suporte', label: 'Suporte', icon: Headphones },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 font-sans font-medium text-sm transition-all rounded-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
              active
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-amber-500' : 'text-slate-500')} aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </>
  )
}
