'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  name?: string | null
  email?: string | null
  image?: string | null
  isAdmin?: boolean | null
}

interface UserProfileButtonProps {
  user: UserProfile
}

export const UserProfileButton = memo(function UserProfileButton({
  user,
}: UserProfileButtonProps) {
  const router = useRouter()

  return (
    <button
      className="flex items-center gap-3 hover:bg-slate-50 min-h-[44px] py-1.5 px-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
      aria-label="Perfil do usuário"
      onClick={() => router.push('/settings/profile')}
    >
      <div className="hidden sm:flex flex-col items-end">
        <span className="font-sans font-semibold text-sm text-slate-900 leading-none">
          {user?.name || 'Usuário'}
        </span>
        <span className="font-sans text-xs text-slate-500 mt-1">{user?.isAdmin ? 'Administrador' : 'Advogado'}</span>
      </div>
      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-700 font-serif font-bold text-sm">
        {user?.name?.charAt(0).toUpperCase() || 'U'}
      </div>
    </button>
  )
})
