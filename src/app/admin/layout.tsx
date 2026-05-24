import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, CreditCard, Activity, Package, ArrowLeft, DollarSign } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (!session.user.isAdmin) redirect('/dashboard')

  const NAV_ITEMS = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuários', icon: Users },
    { href: '/admin/payments', label: 'Pagamentos', icon: CreditCard },
    { href: '/admin/metrics', label: 'Métricas', icon: Activity },
    { href: '/admin/plans', label: 'Planos', icon: Package },
    { href: '/admin/salario-minimo', label: 'Salário Mínimo', icon: DollarSign },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-64 shrink-0 h-screen sticky top-0 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex flex-col">
            <span className="font-serif font-bold text-2xl text-white tracking-tight leading-none">
              PREVI<span className="text-amber-500">ANDO</span>
            </span>
            <span className="font-sans text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-semibold">Admin Panel</span>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Menu</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 font-sans font-medium text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Icon className="w-5 h-5 opacity-70" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 font-sans font-medium text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 opacity-70" />
            Voltar ao App
          </Link>
        </div>
      </aside>
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <h2 className="font-serif font-bold text-xl text-slate-900">Administração</h2>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="font-sans font-semibold text-sm text-slate-900 leading-none">Super Admin</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-serif font-bold text-sm">
              AD
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  )
}
