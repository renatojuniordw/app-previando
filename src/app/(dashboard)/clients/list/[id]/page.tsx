'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useToast } from '@/store/toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DetailSkeleton } from '@/components/ui/Skeleton'
import { ClientPortalCard } from '@/components/client/ClientPortalCard'
import { ClientCnisCard } from '@/components/client/ClientCnisCard'
import { ClientHeader } from '@/components/client/ClientHeader'
import { ClientPersonalInfoCard } from '@/components/client/ClientPersonalInfoCard'
import { ClientCaseStatsCards } from '@/components/client/ClientCaseStatsCards'
import { ClientCasesListCard } from '@/components/client/ClientCasesListCard'
import { NewCaseModal } from '@/components/client/NewCaseModal'
import { EditNotesModal } from '@/components/client/EditNotesModal'
import { useClientDetail } from '@/hooks/useClientDetail'
import { Copy, Mail, Lock } from 'lucide-react'

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
    return <DetailSkeleton />
  }

  if (!client) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Copy className="w-7 h-7 text-slate-300" />
        </div>
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <ClientHeader name={client.name} cpf={client.cpf} priority={client.priority} editHref={`/clients/list/${client.id}/edit`} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopyCpf(client.cpf)}
              className="inline-flex items-center gap-1.5 px-3 py-2 font-sans text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              aria-label="Copiar CPF"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copiar CPF</span>
            </button>
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 font-sans text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all"
                aria-label={`Enviar email para ${client.email}`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Email</span>
              </a>
            )}
          </div>
        </div>

        <ClientCaseStatsCards total={totalCases} active={activeCases} finished={finishedCases} />

        <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-6 lg:space-y-0">
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            <div role="region" aria-label="Dados pessoais do segurado">
              <ClientPersonalInfoCard client={client} onEditNotes={() => (isBlocked ? notifyBlocked() : setShowNotesModal(true))} />
            </div>
            <div role="region" aria-label="CNIS do segurado">
              <ClientCnisCard clientId={client.id} caseCount={totalCases} />
            </div>
          </div>
          <div className="space-y-6 lg:space-y-8 lg:sticky lg:top-24 lg:self-start">
            <div role="region" aria-label="Portal do cliente">
              <ClientPortalCard cases={client.cases} />
            </div>
          </div>
        </div>

        <div role="region" aria-label="Processos vinculados">
          <ClientCasesListCard cases={client.cases} onNewCase={() => (isBlocked ? notifyBlocked() : setShowCaseModal(true))} />
        </div>

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
      </div>
    </ErrorBoundary>
  )
}
