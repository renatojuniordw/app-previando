'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { downloadPdf } from '@/lib/download-pdf'
import { useCaseData } from '../_components/CaseContext'
import type { CaseDetail } from '../_types'
import { STATUS_OPTIONS } from '../_constants'

export function useCaseOverview() {
  const params = useParams()
  const { addToast } = useToast()
  const { data, refresh } = useCaseData()

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [updatingCase, setUpdatingCase] = useState(false)

  useEffect(() => {
    if (data?.status) setNewStatus(data.status)
  }, [data?.status])

  const load = useCallback(() => {
    refresh()
  }, [refresh])

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

  const handleEditSubmit = async (formData: { priority: string; deadlineDate: string; notes: string }) => {
    setUpdatingCase(true)
    try {
      await api.put(`/cases/${params.id}`, {
        priority: formData.priority,
        deadlineDate: formData.deadlineDate ? new Date(formData.deadlineDate).toISOString() : null,
        notes: formData.notes || null,
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
    caseData: data as CaseDetail | null,
    loading: data === null,
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
