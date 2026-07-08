import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AdminLayoutClient } from './AdminLayoutClient'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (!session.user.isAdmin) redirect('/dashboard')

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
