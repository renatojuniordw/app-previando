'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'

interface DrawerRedirectProps {
  drawer: string
}

export function DrawerRedirect({ drawer }: DrawerRedirectProps) {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    router.replace(`/cases/${params.id}?drawer=${drawer}`)
  }, [router, params.id, drawer])

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Spinner />
    </div>
  )
}
