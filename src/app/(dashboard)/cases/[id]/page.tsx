'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { useCaseOverview } from './_hooks/useCaseOverview'
import { CaseOverviewSkeleton } from './_components/CaseOverviewSkeleton'
import { CaseInfoCard } from './_components/CaseInfoCard'
import { ActivitySummary } from './_components/ActivitySummary'
import { StatusModal } from './_components/StatusModal'

export default function CaseOverviewPage() {
  const {
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
  } = useCaseOverview()

  useEffect(() => { load() }, [load])

  if (loading) return <CaseOverviewSkeleton />

  if (!caseData) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="font-sans font-medium text-slate-500">Caso não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <CaseInfoCard
        caseData={caseData}
        onStatusChangeClick={() => setShowStatusModal(true)}
        onExportPDF={handleExportPDF}
      />

      <ActivitySummary counts={caseData._count} />

      <StatusModal
        open={showStatusModal}
        newStatus={newStatus}
        loading={updatingStatus}
        onClose={() => setShowStatusModal(false)}
        onStatusChange={setNewStatus}
        onConfirm={handleStatusChange}
      />
    </div>
  )
}
