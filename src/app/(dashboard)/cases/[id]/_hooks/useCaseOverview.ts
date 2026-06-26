'use client'

import { useCallback, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { downloadPdf } from '@/lib/download-pdf'
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

  const [showEditModal, setShowEditModal] = useState(false)
  const [updatingCase, setUpdatingCase] = useState(false)

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

  const handleEditSubmit = async (data: { priority: string; deadlineDate: string; notes: string }) => {
    setUpdatingCase(true)
    try {
      await api.put(`/cases/${params.id}`, {
        priority: data.priority,
        deadlineDate: data.deadlineDate ? new Date(data.deadlineDate).toISOString() : null,
        notes: data.notes || null,
      })
      setShowEditModal(false)
      addToast({ type: 'success', title: 'Sucesso', message: 'Caso atualizado com sucesso.' })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível atualizar o caso.' })
    } finally {
      setUpdatingCase(false)
    }
  }

  const handleExportPDF = () => {
    downloadPdf(params.id as string).then((ok) => {
      if (!ok) addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })
    })
  }

  return {
    caseData,
    loading,
    showStatusModal,
    newStatus,
    updatingStatus,
    showEditModal,
    updatingCase,
    load,
    setNewStatus,
    setShowStatusModal,
    setShowEditModal,
    handleStatusChange,
    handleEditSubmit,
    handleExportPDF,
  }
}
