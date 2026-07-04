'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '@/lib/api'

export interface CaseData {
  id: string
  status: string
  benefitType: string
  priority: string
  client: { id: string; name: string }
  planLimits: Record<string, boolean>
  [key: string]: unknown
}

interface CaseContextValue {
  data: CaseData | null
  refresh: () => Promise<void>
}

const CaseContext = createContext<CaseContextValue>({
  data: null,
  refresh: async () => {},
})

export function CaseProvider({ children, id }: { children: React.ReactNode; id: string }) {
  const [data, setData] = useState<CaseData | null>(null)

  const refresh = useCallback(async () => {
    try {
      const r = await api.get(`/cases/${id}`)
      setData(r.data.case)
    } catch {
      setData(null)
    }
  }, [id])

  useEffect(() => { refresh() }, [refresh])

  return (
    <CaseContext.Provider value={{ data, refresh }}>
      {children}
    </CaseContext.Provider>
  )
}

export function useCaseData() {
  return useContext(CaseContext)
}
