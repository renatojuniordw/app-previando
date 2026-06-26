'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import type { RelatoSocial } from '@/types/bpc-social'

interface BpcSocialInterviewProps {
  caseId: string
  analysisExists: boolean
  relatoSocial: RelatoSocial | null
  onRelatoChange: (relato: RelatoSocial) => void
  onNoteSaved?: (count: number) => void
}

export function BpcSocialInterview({
  caseId,
  analysisExists,
  relatoSocial,
  onRelatoChange,
  onNoteSaved,
}: BpcSocialInterviewProps) {
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localRelato, setLocalRelato] = useState<RelatoSocial | null>(relatoSocial)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const r = await api.post(`/cases/${caseId}/bpc/social`)
      const relato = r.data.relatoSocial as RelatoSocial
      setLocalRelato(relato)
      onRelatoChange(relato)
      setDirty(false)
      // Abre o primeiro domínio por padrão
      if (relato.dominios?.[0]) {
        setExpandedIds(new Set([relato.dominios[0].id]))
      }
    } catch {
      // tratado pelo interceptor
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswerChange = (dominioId: string, itemIdx: number, resposta: string) => {
    if (!localRelato) return
    setLocalRelato({
      dominios: localRelato.dominios.map((d) =>
        d.id === dominioId
          ? {
              ...d,
              itens: d.itens.map((item, idx) =>
                idx === itemIdx ? { ...item, resposta } : item
              ),
            }
          : d
      ),
    })
    setDirty(true)
  }

  const handleSave = async () => {
    if (!localRelato) return
    setSaving(true)
    try {
      const r = await api.patch(`/cases/${caseId}/bpc/social`, { relatoSocial: localRelato })
      onRelatoChange(localRelato)
      setDirty(false)
      if (r.data.bpcNotesCount !== undefined) onNoteSaved?.(r.data.bpcNotesCount)
    } catch {
      // tratado pelo interceptor
    } finally {
      setSaving(false)
    }
  }

  const toggleDomain = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalPerguntas = localRelato?.dominios.reduce((sum, d) => sum + d.itens.length, 0) ?? 0
  const respondidas = localRelato?.dominios.reduce(
    (sum, d) => sum + d.itens.filter((i) => i.resposta.trim().length > 0).length,
    0
  ) ?? 0

  if (!analysisExists) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-6">
        <span className="text-4xl mb-4 grayscale opacity-50">🔒</span>
        <h4 className="font-sans font-semibold text-slate-700 mb-1">Análises Bloqueadas</h4>
        <p className="font-sans text-sm text-slate-500 max-w-sm">
          Preencha e salve os dados do caso na aba ao lado para liberar as análises.
        </p>
      </div>
    )
  }

  if (!localRelato) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-6">
        <span className="text-3xl mb-3">📋</span>
        <h4 className="font-sans font-semibold text-slate-700 mb-1">Roteiro de Entrevista Social</h4>
        <p className="font-sans text-sm text-slate-500 max-w-sm mb-6">
          Gere o roteiro personalizado para a patologia do cliente. Depois registre as respostas durante a entrevista.
        </p>
        <Button onClick={handleGenerate} loading={generating} className="px-6">
          Gerar Roteiro de Entrevista
        </Button>
      </div>
    )
  }

  // Agrupa domínios por categoria
  const categorias = Array.from(new Set(localRelato.dominios.map((d) => d.categoria)))

  return (
    <div className="flex flex-col h-full">
      {/* Barra superior com progresso e ações */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">{respondidas}</span>
            {' / '}{totalPerguntas} respondidas
          </span>
          {dirty && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600">
              • não salvo
            </span>
          )}
        </div>
        <div className="flex gap-2 shrink-0 items-center">
          {confirmingRegenerate ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-md px-3 py-1.5">
              <span className="font-sans text-xs text-amber-800">Substituir roteiro atual?</span>
              <button
                onClick={() => { setConfirmingRegenerate(false); handleGenerate() }}
                className="text-xs font-semibold text-red-600 hover:text-red-800"
              >
                Sim
              </button>
              <button
                onClick={() => setConfirmingRegenerate(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Não
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setConfirmingRegenerate(true)}
              loading={generating}
              className="text-xs py-1.5"
            >
              Regenerar
            </Button>
          )}
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!dirty}
            className="text-xs py-1.5"
          >
            Salvar Respostas
          </Button>
        </div>
      </div>

      {/* Lista de domínios agrupados por categoria */}
      <div className="flex-1 overflow-y-auto">
        {categorias.map((categoria) => {
          const dominiosDaCategoria = localRelato.dominios.filter((d) => d.categoria === categoria)
          return (
            <div key={categoria}>
              {/* Header da categoria */}
              <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {categoria}
                </p>
              </div>

              {/* Domínios */}
              {dominiosDaCategoria.map((dominio) => {
                const isExpanded = expandedIds.has(dominio.id)
                const respostasNoDominio = dominio.itens.filter((i) => i.resposta.trim()).length
                const totalNoDominio = dominio.itens.length

                return (
                  <div key={dominio.id} className="border-b border-slate-100 last:border-b-0">
                    {/* Header do domínio */}
                    <button
                      onClick={() => toggleDomain(dominio.id)}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-sans text-sm font-medium text-slate-800">
                        {dominio.titulo}
                      </span>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {respostasNoDominio > 0 ? (
                          <span className="text-[10px] font-sans font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {respostasNoDominio}/{totalNoDominio}
                          </span>
                        ) : (
                          <span className="text-[10px] font-sans text-slate-400">
                            {totalNoDominio} perguntas
                          </span>
                        )}
                        <svg
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Conteúdo expandido */}
                    {isExpanded && (
                      <div className="px-5 pb-6 bg-white space-y-5">
                        {/* Aspecto relevante */}
                        {dominio.aspectosRelevantes && (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 leading-relaxed">
                            <span className="font-semibold">Foco: </span>
                            {dominio.aspectosRelevantes}
                          </p>
                        )}

                        {/* Perguntas + respostas */}
                        {dominio.itens.map((item, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <p className="font-sans text-sm text-slate-700 font-medium leading-snug">
                              {idx + 1}. {item.pergunta}
                            </p>
                            <textarea
                              value={item.resposta}
                              onChange={(e) => handleAnswerChange(dominio.id, idx, e.target.value)}
                              placeholder="Registre o que o cliente relatou..."
                              rows={2}
                              className="w-full neo-input resize-none font-sans text-sm text-slate-700 placeholder:text-slate-400 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                          </div>
                        ))}

                        {/* Lacunas */}
                        {dominio.lacunas && (
                          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 leading-relaxed">
                            <span className="font-semibold text-slate-500">Lacunas a investigar: </span>
                            {dominio.lacunas}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Footer de aviso */}
      <div className="border-t border-amber-200 bg-amber-50 px-5 py-3 shrink-0">
        <p className="text-[10px] font-mono font-bold uppercase text-amber-600 tracking-widest leading-relaxed">
          As respostas registradas são de responsabilidade do advogado responsável pelo caso. Previando é um produto Unificando.
        </p>
      </div>
    </div>
  )
}
