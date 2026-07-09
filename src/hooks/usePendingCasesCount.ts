import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function usePendingCasesCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    api.get('/cases?limit=1').then(r => setCount(r.data.total ?? 0)).catch(() => {})
  }, [])
  return count
}
