import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { UpgradeModal } from '@/components/UpgradeModal'
import { ToastContainer } from '@/components/ToastContainer'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header />
          <main id="main-content" className="flex-1 overflow-auto bg-slate-50 outline-none" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
      <UpgradeModal />
      <ToastContainer />
    </SessionProvider>
  )
}
