'use client'

import { PrimeReactProvider as PRProvider } from 'primereact/api'
import { previandoTheme } from '@/theme/primereact-theme'

export function PrimeReactProvider({ children }: { children: React.ReactNode }) {
  return (
    <PRProvider value={{ ripple: true, unstyled: false, theme: { preset: previandoTheme } } as any}>
      {children}
    </PRProvider>
  )
}
