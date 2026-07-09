'use client'

import { PageError } from '@/components/ui/PageError'

export default function CalendarError({ error, reset }: { error: Error; reset: () => void }) {
  return <PageError title="Erro ao carregar calendário" error={error} reset={reset} />
}
