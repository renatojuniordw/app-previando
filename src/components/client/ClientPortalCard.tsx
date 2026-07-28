'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardHeader } from '@/components/ui/Card'
import {
  Copy, Loader2, CheckCircle2,
  Clock, XCircle, Share2, ExternalLink,
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
}

interface Props {
  cases: Case[]
}

function daysLeft(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function ClientPortalCard({ cases }: Props) {
  const router = useRouter()
  const { addToast } = useToast()
  const [showAll, setShowAll] = useState(false)
  const MAX_VISIBLE = 3
  const visibleCases = showAll ? cases : cases.slice(0, MAX_VISIBLE)

  const [portals, setPortals] = useState<Record<string, PortalState>>(() =>
    Object.fromEntries(cases.map((c) => [c.id, { link: null, expiresAt: null, loading: true }]))
  )

  useEffect(() => {
    if (cases.length === 0) return

    Promise.all(
      cases.map(async (c) => {
        try {
          const r = await api.get(`/cases/${c.id}/portal`)
          setPortals((prev) => ({
            ...prev,
            [c.id]: { link: r.data.link ?? null, expiresAt: r.data.expiresAt ?? null, loading: false },
          }))
        } catch {
          setPortals((prev) => ({
            ...prev,
            [c.id]: { link: null, expiresAt: null, loading: false },
          }))
        }
      })
    )
  }, [cases])

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
        subtitle="Clique em um caso para gerenciar o portal completo"
      />

      <div className="space-y-3 mt-1">
        {visibleCases.map((c) => {
          const state = portals[c.id] ?? { link: null, expiresAt: null, loading: true }
          const benefitLabel = BENEFIT_DB_LABELS[c.benefitType] ?? BENEFIT_SHORT_LABELS[c.benefitType] ?? c.benefitType
          const isActive = !!state.link && !!state.expiresAt && new Date(state.expiresAt) > new Date()
          const days = isActive && state.expiresAt ? daysLeft(state.expiresAt) : 0

          return (
              <div
                key={c.id}
                onClick={() => router.push(`/cases/${c.id}`)}
                className={`space-y-2 rounded-xl border p-3 transition-all cursor-pointer group ${
                  isActive ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Linha 1: ícone + nome do benefício + seta */}
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isActive ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                  {state.loading ? (
                    <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                  ) : isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                  <p className="font-sans font-semibold text-sm text-slate-800 leading-snug group-hover:text-amber-700 transition-colors flex-1">{benefitLabel}</p>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition-colors shrink-0 mt-1" />
                </div>

                {/* Linha 2: status + copiar link */}
                {!state.loading && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pl-10">
                    {isActive && state.link ? (
                      <>
                        <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium min-w-0">
                          <Clock className="w-3 h-3 shrink-0 text-emerald-600" />
                          <span>Ativo · expira em {days} dia{days !== 1 ? 's' : ''}</span>
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); copyLink(state.link!) }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            title="Copiar link"
                          >
                            <Copy className="w-3 h-3" />
                            Copiar
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium cursor-default">Link não gerado</span>
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
