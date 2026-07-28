'use client'

import { AlertCircle } from 'lucide-react'
import { useCaseOverview } from './_hooks/useCaseOverview'
import { CaseOverviewSkeleton } from './_components/CaseOverviewSkeleton'
import { CaseInfoCard } from './_components/CaseInfoCard'
import { ActivitySummary } from './_components/ActivitySummary'
import { StatusModal } from './_components/StatusModal'
import { EditCaseModal } from './_components/EditCaseModal'
import { SuccessAnalysisCard } from './_components/SuccessAnalysisCard'
import { PortalConfigCard } from './_components/PortalConfigCard'

export default function CaseOverviewPage() {
  const {
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
  } = useCaseOverview()

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
    <div className="space-y-6 max-w-5xl mx-auto">
      <CaseInfoCard
        caseData={caseData}
        clientName={caseData.client.name}
        onStatusChangeClick={() => setShowStatusModal(true)}
        onExportPDF={handleExportPDF}
        onEditClick={() => setShowEditModal(true)}
      />

      <ActivitySummary counts={caseData._count} caseId={caseData.id} />

      <SuccessAnalysisCard
        caseId={caseData.id}
        hasDiagnosis={caseData.planLimits?.diagnosisEnabled ?? false}
      />

      <PortalConfigCard
        caseId={caseData.id}
        benefitType={caseData.benefitType}
        portalConfig={caseData.portalConfig}
        onUpdate={load}
      />

      <StatusModal
        open={showStatusModal}
        newStatus={newStatus}
        loading={updatingStatus}
        onClose={() => setShowStatusModal(false)}
        onStatusChange={setNewStatus}
        onConfirm={handleStatusChange}
      />

      <EditCaseModal
        open={showEditModal}
        caseData={caseData}
        loading={updatingCase}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSubmit}
      />
    </div>
  )
}
