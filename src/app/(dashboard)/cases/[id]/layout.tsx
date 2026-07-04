'use client'

import { useParams } from 'next/navigation'
import { CaseProvider } from './_components/CaseContext'
import { CaseLayoutClient } from './_components/CaseLayoutClient'

export default function CaseLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()

  return (
    <CaseProvider id={params.id as string}>
      <CaseLayoutClient>
        {children}
      </CaseLayoutClient>
    </CaseProvider>
  )
}
