'use client'

import { PageError } from '@/components/ui/PageError'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <PageError title="Erro ao carregar simulador" error={error} reset={reset} />
}
