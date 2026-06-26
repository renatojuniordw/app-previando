'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ChecklistRedirectPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    router.replace(`/cases/${params.id}?drawer=checklist`)
  }, [router, params.id])

  return (
    <div className="flex items-center justify-center py-12">
      <span className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mr-2" />
      <span className="font-sans text-sm text-slate-500">Carregando checklist...</span>
    </div>
  )
}
