'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import type { RelatoSocial } from '@/types/bpc-social'
import { useToast } from '@/store/toast'
import {
  Lock,
  ClipboardList,
  AlertTriangle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Save,
} from 'lucide-react'

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
  const addToast = useToast((s) => s.addToast)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localRelato, setLocalRelato] = useState<RelatoSocial | null>(relatoSocial)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

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
      addToast({
        type: 'success',
        title: 'roteiro gerado',
        message: 'o roteiro de entrevista social foi gerado com sucesso.',
      })
    } catch {
      addToast({
        type: 'error',
        title: 'erro ao gerar',
        message: 'não foi possível gerar o roteiro de entrevista social.',
      })
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
              itens: d.itens.map((item, idx) => (idx === itemIdx ? { ...item, resposta } : item)),
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
      addToast({
        type: 'success',
        title: 'respostas salvas',
        message: 'as respostas da entrevista social foram salvas com sucesso.',
      })
    } catch {
      addToast({
        type: 'error',
        title: 'erro ao salvar',
        message: 'ocorreu um erro ao salvar as respostas.',
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleDomain = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const totalPerguntas = localRelato?.dominios.reduce((sum, d) => sum + d.itens.length, 0) ?? 0
  const respondidas =
    localRelato?.dominios.reduce(
      (sum, d) => sum + d.itens.filter((i) => i.resposta.trim().length > 0).length,
      0
    ) ?? 0

  if (!analysisExists) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <Lock className="text-slate-350 mb-4 h-10 w-10" />
        <h4 className="mb-1 font-sans font-semibold text-slate-700">Análises Bloqueadas</h4>
        <p className="max-w-sm font-sans text-sm text-slate-500">
          Preencha e salve os dados do caso na aba ao lado para liberar as análises.
        </p>
      </div>
    )
  }

  if (!localRelato) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <ClipboardList className="text-slate-350 mb-4 h-10 w-10" />
        <h4 className="mb-1 font-sans font-semibold text-slate-700">
          Roteiro de Entrevista Social
        </h4>
        <p className="mb-6 max-w-sm font-sans text-sm text-slate-500">
          Gere o roteiro personalizado para a patologia do cliente. Depois registre as respostas
          durante a entrevista.
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
    <div className={`flex flex-col ${fullscreen ? 'fixed inset-0 z-50 !bg-slate-50' : 'h-full bg-white'}`}>
      {/* Barra superior com progresso e ações */}
      <div className={`flex shrink-0 items-center border-b border-slate-200 py-3 ${fullscreen ? '!bg-white shadow-xs' : 'bg-slate-50'}`}>
        <div className={`flex flex-1 flex-wrap items-center justify-between gap-3 px-5 ${fullscreen ? 'max-w-5xl mx-auto w-full' : ''}`}>
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">{respondidas}</span>
              {' / '}
              {totalPerguntas} respondidas
            </span>
            {dirty && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber-600">
                • Não Salvo
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setFullscreen((f) => !f)}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title={fullscreen ? 'Sair do modo entrevista' : 'Modo entrevista (tela cheia)'}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            {confirmingRegenerate ? (
              <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5">
                <span className="font-sans text-xs text-amber-800">
                  {dirty
                    ? 'Há respostas não salvas. Regenerar irá descartá-las. Confirmar?'
                    : 'Substituir roteiro atual?'}
                </span>
                <button
                  onClick={() => {
                    setConfirmingRegenerate(false)
                    handleGenerate()
                  }}
                  className="whitespace-nowrap text-xs font-semibold text-red-600 hover:text-red-800"
                >
                  Sim, substituir
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
                className="flex items-center gap-1 py-1.5 text-xs"
              >
                <RefreshCw className="h-3 w-3 text-slate-500" />
                Regenerar
              </Button>
            )}
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!dirty}
              className="flex items-center gap-1 py-1.5 text-xs"
            >
              <Save className="h-3.5 w-3.5 text-white" />
              Salvar Respostas
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de domínios agrupados por categoria */}
      <div className="relative flex-1 overflow-y-auto">
        <div className={fullscreen ? 'max-w-5xl mx-auto w-full py-8 px-5' : ''}>
          {categorias.map((categoria) => {
            const dominiosDaCategoria = localRelato.dominios.filter((d) => d.categoria === categoria)
            return (
              <div key={categoria} className={fullscreen ? 'border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs mb-8' : ''}>
                {/* Header da categoria */}
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 px-5 py-2">
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
                        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="font-sans text-sm font-medium text-slate-800">
                          {dominio.titulo}
                        </span>
                        <div className="ml-3 flex shrink-0 items-center gap-3">
                          {respostasNoDominio > 0 ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-sans text-[10px] font-semibold text-emerald-600">
                              {respostasNoDominio}/{totalNoDominio}
                            </span>
                          ) : (
                            <span className="font-sans text-[10px] text-slate-400">
                              {totalNoDominio} perguntas
                            </span>
                          )}
                          <svg
                            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Conteúdo expandido */}
                      {isExpanded && (
                        <div className="space-y-5 bg-white px-5 pb-6">
                          {/* Aspecto relevante */}
                          {dominio.aspectosRelevantes && (
                            <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
                              <span className="font-semibold">Foco: </span>
                              {dominio.aspectosRelevantes}
                            </p>
                          )}

                          {/* Perguntas + respostas */}
                          {dominio.itens.map((item, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <p className="font-sans text-sm font-medium leading-snug text-slate-700">
                                {idx + 1}. {item.pergunta}
                              </p>
                              <textarea
                                value={item.resposta}
                                onChange={(e) => handleAnswerChange(dominio.id, idx, e.target.value)}
                                placeholder="Registre o que o cliente relatou..."
                                rows={2}
                                className="neo-input w-full resize-none font-sans text-sm text-slate-700 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                              />
                            </div>
                          ))}

                          {/* Lacunas */}
                          {dominio.lacunas && (
                            <p className="border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
                              <span className="font-semibold text-slate-500">
                                Lacunas a investigar:{' '}
                              </span>
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
      </div>

      {/* Footer de aviso */}
      <div className={`flex shrink-0 items-center border-t border-slate-100 py-2.5 ${fullscreen ? '!bg-white' : 'bg-amber-50/10'}`}>
        <div className={`flex flex-1 items-center gap-2 px-5 ${fullscreen ? 'max-w-5xl mx-auto w-full' : ''}`}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-relaxed text-slate-400">
            As respostas são de responsabilidade do advogado responsável pelo caso.
          </p>
        </div>
      </div>
    </div>
  )
}
