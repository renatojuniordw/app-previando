'use client'

import { PageError } from '@/components/ui/PageError'

export default function HonorariosError({ error, reset }: { error: Error; reset: () => void }) {
  return <PageError title="Erro ao carregar honorários" error={error} reset={reset} />
}
