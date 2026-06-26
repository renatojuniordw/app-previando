'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function OpinionsRedirectPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    router.replace(`/cases/${params.id}?drawer=opinions`)
  }, [router, params.id])

  return (
    <div className="flex align-items-center justify-content-center py-12">
      <span className="w-5 h-5 border-2 border-[var(--color-primary-dark)] border-t-transparent rounded-full animate-spin mr-2" />
      <span className="font-sans text-sm text-slate-500">Carregando pareceres...</span>
    </div>
  )
}
