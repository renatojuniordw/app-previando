'use client'

import { useParams } from 'next/navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ClientFormPage } from '@/components/client/ClientFormPage'

export default function EditClientPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <ErrorBoundary>
      <ClientFormPage clientId={id} />
    </ErrorBoundary>
  )
}
