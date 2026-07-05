import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (!session.user.isAdmin) redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-slate-900 font-sans text-slate-900">
      <aside className="w-64 shrink-0 h-screen sticky top-0 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex flex-col">
            <span className="font-serif font-bold text-2xl text-white tracking-tight leading-none">
              PREVI<span className="text-amber-500">ANDO</span>
            </span>
            <span className="font-sans text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-semibold">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1" role="navigation" aria-label="Navegação administrativa">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Menu</p>
          <AdminNav />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2.5 font-sans font-medium text-sm text-slate-400 hover:text-white transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao App
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-800">Administração</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto neo-scroll">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
