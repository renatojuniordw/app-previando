'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ClientFormPage } from '@/components/client/ClientFormPage'

export default function NewClientPage() {
  return (
    <ErrorBoundary>
      <ClientFormPage />
    </ErrorBoundary>
  )
}
