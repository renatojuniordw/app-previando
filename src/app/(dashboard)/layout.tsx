import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { UpgradeModal } from '@/components/UpgradeModal'
import { ToastContainer } from '@/components/ToastContainer'
import { DashboardLayoutClient } from './DashboardLayoutClient'
import { MuiThemeProvider } from '@/components/ui/MuiThemeProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <SessionProvider session={session}>
      <MuiThemeProvider>
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Header />
            <DashboardLayoutClient>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-white focus:text-amber-700 focus:border focus:border-amber-500 focus:rounded-lg focus:shadow-lg focus:font-sans focus:font-medium focus:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Pular para o conteúdo principal
              </a>
              <main id="main-content" className="flex-1 overflow-auto bg-slate-50 outline-none" tabIndex={-1}>
                {children}
              </main>
            </DashboardLayoutClient>
          </div>
        </div>
        <UpgradeModal />
        <ToastContainer />
      </MuiThemeProvider>
    </SessionProvider>
  )
}
