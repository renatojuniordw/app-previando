'use client'

import { useEffect } from 'react'
import { PageError } from '@/components/ui/PageError'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard] Unhandled error:', error)
  }, [error])

  return <PageError title="Ocorreu um erro inesperado" error={error} reset={reset} />
}
