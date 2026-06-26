'use client'

import { useCallback, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import type { CaseDetail } from '../_types'
import { STATUS_OPTIONS } from '../_constants'

export function useCaseOverview() {
  const params = useParams()
  const { addToast } = useToast()

  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = useCallback(() => {
    api.get(`/cases/${params.id}`)
      .then((r) => {
        setCaseData(r.data.case)
        setNewStatus(r.data.case.status)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [params.id])

  const handleStatusChange = async () => {
    setUpdatingStatus(true)
    try {
      await api.patch(`/cases/${params.id}/status`, { status: newStatus })
      setShowStatusModal(false)
      addToast({
        type: 'success',
        title: 'Status alterado',
        message: `Caso atualizado para ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label ?? newStatus}.`,
      })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível alterar o status.' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleExportPDF = () => {
    window.open(`/api/export/pdf/${params.id}`, '_blank')
  }

  return {
    caseData,
    loading,
    showStatusModal,
    newStatus,
    updatingStatus,
    load,
    setNewStatus,
    setShowStatusModal,
    handleStatusChange,
    handleExportPDF,
  }
}
