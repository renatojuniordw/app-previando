'use client'

import { useState } from 'react'
import api from '@/lib/api'

export interface CepAddress {
  street: string
  neighborhood: string
  city: string
  state: string
}

/** Looks up an address via the /cep endpoint and reports the result through `onFound`. */
export function useCepLookup(onFound: (address: CepAddress) => void) {
  const [cepLoading, setCepLoading] = useState(false)

  const lookupCep = async (rawCep: string) => {
    if (rawCep.length !== 8) return
    setCepLoading(true)
    try {
      const r = await api.get('/cep', { params: { cep: rawCep } })
      onFound({
        street: r.data.street,
        neighborhood: r.data.neighborhood,
        city: r.data.city,
        state: r.data.state,
      })
    } catch {
    } finally {
      setCepLoading(false)
    }
  }

  return { cepLoading, lookupCep }
}
