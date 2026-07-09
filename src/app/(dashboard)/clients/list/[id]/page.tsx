'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useToast } from '@/store/toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ClientFloatingActions } from '@/components/client/ClientFloatingActions'
import { ClientPortalCard } from '@/components/client/ClientPortalCard'
import { ClientCnisCard } from '@/components/client/ClientCnisCard'
import { ClientHeader } from '@/components/client/ClientHeader'
import { ClientPersonalInfoCard } from '@/components/client/ClientPersonalInfoCard'
import { ClientCaseStatsCards } from '@/components/client/ClientCaseStatsCards'
import { ClientCasesListCard } from '@/components/client/ClientCasesListCard'
import { NewCaseModal } from '@/components/client/NewCaseModal'
import { EditNotesModal } from '@/components/client/EditNotesModal'
import { useClientDetail } from '@/hooks/useClientDetail'
import { User, Lock } from 'lucide-react'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const { client, loading, createCase, saveNotes } = useClientDetail(clientId)
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const { addToast } = useToast()

  const handleCopyCpf = (cpf: string) => {
    navigator.clipboard.writeText(cpf.replace(/\D/g, ''))
    addToast({ type: 'success', title: 'Copiado', message: 'CPF copiado.' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
        <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-serif font-bold text-slate-850 text-base">Cliente não encontrado</h3>
        <p className="font-sans text-slate-500 text-sm mt-1">Este registro pode ter sido excluído ou não existe.</p>
        <button onClick={() => router.push('/clients/list')} className="mt-4 font-sans font-bold text-xs text-amber-600 hover:underline">
          Voltar à lista de clientes
        </button>
      </div>
    )
  }

  const totalCases = client.cases.length
  const finishedCases = client.cases.filter(c => ['FINISHED', 'FINALIZADO'].includes(c.status.toUpperCase())).length
  const activeCases = totalCases - finishedCases
  const isBlocked = client.active === false

  const notifyBlocked = () => {
    addToast({
      type: 'error',
      title: 'Cliente bloqueado',
      message: 'Este cliente excedeu o limite do seu plano e está somente-leitura. Ative outro cliente, exclua algum ou faça upgrade.',
    })
  }

  return (
    <ErrorBoundary>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">
        {isBlocked && (
          <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-4 rounded-xl shadow-sm">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-sans font-bold text-sm text-amber-900">Cliente bloqueado — somente leitura</p>
              <p className="font-sans text-sm text-amber-700 mt-0.5">
                Este cliente excedeu o limite de clientes ativos do seu plano. Não é possível editar dados, criar casos, cálculos ou pareceres para ele.
                Ative-o na listagem de clientes (desativando outro) ou faça upgrade do plano.
              </p>
            </div>
          </div>
        )}

        <ClientHeader name={client.name} cpf={client.cpf} />

        <ClientPersonalInfoCard client={client} onEditNotes={() => (isBlocked ? notifyBlocked() : setShowNotesModal(true))} />

        <ClientCnisCard clientId={client.id} caseCount={totalCases} />

        <ClientCaseStatsCards total={totalCases} active={activeCases} finished={finishedCases} />

        <ClientPortalCard cases={client.cases} />

        <ClientCasesListCard cases={client.cases} onNewCase={() => (isBlocked ? notifyBlocked() : setShowCaseModal(true))} />

        <NewCaseModal
          clientId={client.id}
          open={showCaseModal}
          onClose={() => setShowCaseModal(false)}
          onCreate={createCase}
        />

        <EditNotesModal
          open={showNotesModal}
          initialNotes={client.notes ?? ''}
          onClose={() => setShowNotesModal(false)}
          onSave={saveNotes}
        />

        <ClientFloatingActions
          email={client.email}
          cpf={client.cpf}
          onEdit={() => (isBlocked ? notifyBlocked() : setShowNotesModal(true))}
          onCopyCpf={handleCopyCpf}
        />
      </div>
    </ErrorBoundary>
  )
}
