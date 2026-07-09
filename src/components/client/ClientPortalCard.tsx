'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardHeader } from '@/components/ui/Card'
import {
  Link2, Copy, RefreshCw, Loader2, CheckCircle2,
  Clock, XCircle, Share2,
} from 'lucide-react'
import { useToast } from '@/store/toast'
import { BENEFIT_DB_LABELS, BENEFIT_SHORT_LABELS } from '@/lib/constants'

interface Case {
  id: string
  benefitType: string
  status: string
}

interface PortalState {
  link: string | null
  expiresAt: string | null
  loading: boolean
  generating: boolean
}

interface Props {
  cases: Case[]
}

function daysLeft(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function ClientPortalCard({ cases }: Props) {
  const { addToast } = useToast()
  const [showAll, setShowAll] = useState(false)
  const MAX_VISIBLE = 3
  const visibleCases = showAll ? cases : cases.slice(0, MAX_VISIBLE)

  const [portals, setPortals] = useState<Record<string, PortalState>>(() =>
    Object.fromEntries(cases.map((c) => [c.id, { link: null, expiresAt: null, loading: true, generating: false }]))
  )

  useEffect(() => {
    if (cases.length === 0) return

    Promise.all(
      cases.map(async (c) => {
        try {
          const r = await api.get(`/cases/${c.id}/portal`)
          setPortals((prev) => ({
            ...prev,
            [c.id]: { link: r.data.link ?? null, expiresAt: r.data.expiresAt ?? null, loading: false, generating: false },
          }))
        } catch {
          setPortals((prev) => ({
            ...prev,
            [c.id]: { link: null, expiresAt: null, loading: false, generating: false },
          }))
        }
      })
    )
  }, [cases])

  async function generateLink(caseId: string) {
    setPortals((prev) => ({ ...prev, [caseId]: { ...prev[caseId], generating: true } }))
    try {
      const r = await api.post(`/cases/${caseId}/portal`)
      setPortals((prev) => ({
        ...prev,
        [caseId]: { link: r.data.link, expiresAt: r.data.expiresAt, loading: false, generating: false },
      }))
      addToast({ type: 'success', title: 'Link gerado', message: 'Portal do cliente ativo por 30 dias.' })
    } catch {
      setPortals((prev) => ({ ...prev, [caseId]: { ...prev[caseId], generating: false } }))
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o link.' })
    }
  }

  async function revokeLink(caseId: string) {
    setPortals((prev) => ({ ...prev, [caseId]: { ...prev[caseId], generating: true } }))
    try {
      await api.delete(`/cases/${caseId}/portal`)
      setPortals((prev) => ({
        ...prev,
        [caseId]: { link: null, expiresAt: null, loading: false, generating: false },
      }))
      addToast({ type: 'success', title: 'Link revogado', message: 'O cliente não terá mais acesso.' })
    } catch {
      setPortals((prev) => ({ ...prev, [caseId]: { ...prev[caseId], generating: false } }))
    }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link)
    addToast({ type: 'success', title: 'Copiado!', message: 'Link do portal copiado para a área de transferência.' })
  }

  if (cases.length === 0) {
    return (
      <div id="portal">
      <Card variant="dark">
        <CardHeader title="Portal do Cliente" />
        <p className="font-sans text-sm text-slate-500 pb-2">
          Nenhum caso vinculado — crie um caso para gerar o link do portal.
        </p>
      </Card>
    </div>
    )
  }

  return (
    <div id="portal">
    <Card variant="dark">
      <CardHeader
        title="Portal do Cliente"
        subtitle="Compartilhe um link para o cliente acompanhar os dados do caso"
      />

      <div className="space-y-3 mt-1">
        {visibleCases.map((c) => {
          const state = portals[c.id] ?? { link: null, expiresAt: null, loading: true, generating: false }
          const benefitLabel = BENEFIT_DB_LABELS[c.benefitType] ?? BENEFIT_SHORT_LABELS[c.benefitType] ?? c.benefitType
          const isActive = !!state.link && !!state.expiresAt && new Date(state.expiresAt) > new Date()
          const days = isActive && state.expiresAt ? daysLeft(state.expiresAt) : 0

          return (
            <div
              key={c.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border p-4 transition-colors ${
                isActive ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'
              }`}
            >
              {/* Caso info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-emerald-100' : 'bg-slate-100'
                }`}>
                  {state.loading ? (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  ) : isActive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-sans font-semibold text-sm text-slate-800 truncate">{benefitLabel}</p>
                  {state.loading ? (
                    <p className="text-xs text-slate-400">Verificando...</p>
                  ) : isActive ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <p className="text-xs text-emerald-700 font-medium">
                        Ativo · expira em {days} dia{days !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Sem link ativo</p>
                  )}
                </div>
              </div>

              {/* Ações */}
              {!state.loading && (
                <div className="flex items-center gap-2 shrink-0">
                  {isActive && state.link ? (
                    <>
                      <button
                        onClick={() => copyLink(state.link!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Copiar link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </button>

                      <button
                        onClick={() => generateLink(c.id)}
                        disabled={state.generating}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Renovar link (mais 30 dias)"
                      >
                        {state.generating
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <RefreshCw className="w-3.5 h-3.5" />
                        }
                      </button>

                      <button
                        onClick={() => revokeLink(c.id)}
                        disabled={state.generating}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Revogar acesso"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => generateLink(c.id)}
                      disabled={state.generating}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {state.generating
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Link2 className="w-3.5 h-3.5" />
                      }
                      {state.generating ? 'Gerando...' : 'Gerar link'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {cases.length > MAX_VISIBLE && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center py-2 text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
        >
          {showAll ? 'Ver menos' : `Ver todos (${cases.length})`}
        </button>
      )}

      <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
        <Share2 className="w-3.5 h-3.5" />
        O cliente acessa sem precisar criar conta — apenas com o link seguro de 30 dias.
      </p>
    </Card>
    </div>
  )
}
