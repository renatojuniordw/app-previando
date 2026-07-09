'use client'

import { PageError } from '@/components/ui/PageError'

export default function ActivityError({ error, reset }: { error: Error; reset: () => void }) {
  return <PageError title="Erro ao carregar atividades" error={error} reset={reset} />
}
