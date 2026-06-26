'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

export function useUrgentDeadlines() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    api.get('/dashboard/deadlines')
      .then((r) => {
        const deadlines: { daysLeft: number | null }[] = r.data.deadlines ?? []
        const urgent = deadlines.filter((d) => d.daysLeft !== null && d.daysLeft <= 3).length
        setCount(urgent)
      })
      .catch(() => null)
  }, [])

  return count
}
