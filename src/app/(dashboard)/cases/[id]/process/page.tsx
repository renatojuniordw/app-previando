'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { buildProcessWhatsAppMessage, buildWhatsAppLink } from '@/lib/whatsapp'

interface ProcessData {
  processNumber: string | null
  summary: string | null
  lastMovDate: string | null
  lastMovCount: number | null
  lastCheck: string | null
  fromCache?: boolean
  noChanges?: boolean
  cacheWarning?: boolean
}

interface CaseInfo {
  id: string
  processNumber: string | null
  client: { phone: string | null }
}

const CNJ_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/

export default function CaseProcessPage() {
  const params = useParams()
  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null)
  const [processData, setProcessData] = useState<ProcessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [consulting, setConsulting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingNumber, setEditingNumber] = useState(false)
  const [inputNumber, setInputNumber] = useState('')
  const [inputError, setInputError] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get(`/cases/${params.id}`)
      .then((r) => {
        setCaseInfo(r.data.case)
        setInputNumber(r.data.case.processNumber ?? '')
        if (r.data.case.processNumber) {
          setProcessData({ processNumber: r.data.case.processNumber, summary: null, lastMovDate: null, lastMovCount: null, lastCheck: null })
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [params.id])

  const handleSaveNumber = async () => {
    if (!CNJ_REGEX.test(inputNumber.trim())) {
      setInputError('Formato inválido. Use: 0000000-00.0000.0.00.0000')
      return
    }
    setSaving(true)
    setInputError('')
    try {
      await api.patch(`/cases/${params.id}/process`, { processNumber: inputNumber.trim() })
      setCaseInfo((prev) => prev ? { ...prev, processNumber: inputNumber.trim() } : prev)
      setProcessData({ processNumber: inputNumber.trim(), summary: null, lastMovDate: null, lastMovCount: null, lastCheck: null })
      setEditingNumber(false)
    } catch (err: unknown) {
      setInputError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleConsult = async () => {
    setConsulting(true)
    setError(null)
    try {
      const res = await api.get(`/cases/${params.id}/process`)
      setProcessData(res.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao consultar processo.'
      setError(msg)
    } finally {
      setConsulting(false)
    }
  }

  const handleCopy = () => {
    if (!processData?.summary) return
    navigator.clipboard.writeText(processData.summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    if (!processData?.summary || !caseInfo?.client.phone) return
    const message = buildProcessWhatsAppMessage({
      processNumber: processData.processNumber!,
      lastMovDate: processData.lastMovDate,
      summary: processData.summary,
    })
    window.open(buildWhatsAppLink(caseInfo.client.phone, message), '_blank')
  }

  if (loading) {
    return <div className="font-mono text-slate-400 animate-pulse">Carregando...</div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Explicação */}
      <div className="border-2 border-slate-700 bg-slate-900 p-4">
        <p className="font-mono font-black text-[10px] uppercase tracking-widest text-[#ccff00] mb-1">
          O QUE É A CONSULTA DE PROCESSO?
        </p>
        <p className="font-mono text-xs text-slate-400 leading-relaxed">
          Informe o número CNJ do processo e o Previando consulta o andamento no Datajud automaticamente.
          Receba um resumo em linguagem clara — sem precisar abrir o PJe.
        </p>
      </div>

      {/* Sem número ou editando */}
      {(!caseInfo?.processNumber || editingNumber) ? (
        <div className="border-2 border-dashed border-slate-700 p-8 text-center">
          <div className="text-4xl mb-3">⚖️</div>
          <h3 className="font-mono font-black text-lg text-white uppercase mb-2">
            INFORME O NÚMERO DO PROCESSO
          </h3>
          <p className="font-mono text-xs text-slate-400 mb-6 max-w-sm mx-auto">
            Formato CNJ: 0001234-55.2024.4.03.6183
            <br />
            Você encontra esse número no protocolo do INSS ou na distribuição judicial.
          </p>
          <div className="max-w-md mx-auto space-y-3">
            <input
              type="text"
              value={inputNumber}
              onChange={(e) => {
                setInputNumber(e.target.value)
                setInputError('')
              }}
              placeholder="0000000-00.0000.0.00.0000"
              className="neo-input text-center font-mono"
            />
            {inputError && <p className="font-mono text-xs text-red-400">{inputError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleSaveNumber}
                disabled={saving}
                className="flex-1 bg-slate-950 text-[#ccff00] font-mono font-black uppercase tracking-widest text-xs px-6 py-3 border-2 border-slate-700 hover:border-[#ccff00] transition-colors disabled:opacity-50"
              >
                {saving ? 'SALVANDO...' : 'SALVAR NÚMERO DO PROCESSO'}
              </button>
              {editingNumber && (
                <button
                  onClick={() => { setEditingNumber(false); setInputError('') }}
                  className="border-2 border-slate-700 text-slate-400 font-mono font-black uppercase text-xs px-4 py-3 hover:border-slate-500 transition-colors"
                >
                  CANCELAR
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Número salvo + botão consultar */}
          <div className="border-2 border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                  NÚMERO DO PROCESSO (CNJ)
                </p>
                <p className="font-mono font-bold text-white text-base">{caseInfo.processNumber}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleConsult}
                  disabled={consulting}
                  className="bg-[#ccff00] text-slate-950 font-mono font-black uppercase tracking-widest text-xs px-5 py-3 border-2 border-black hover:bg-[#b3ff00] transition-colors disabled:opacity-50"
                >
                  {consulting ? '⏳ CONSULTANDO...' : '🔍 CONSULTAR PROCESSO'}
                </button>
                <button
                  onClick={() => setEditingNumber(true)}
                  className="border-2 border-slate-600 text-slate-400 font-mono font-black uppercase text-xs px-4 py-3 hover:border-slate-400 transition-colors"
                >
                  EDITAR
                </button>
              </div>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="border-2 border-red-600 bg-red-950 p-4">
              <p className="font-mono font-black text-[10px] uppercase tracking-widest text-red-400 mb-1">
                ⚠️ ERRO NA CONSULTA
              </p>
              <p className="font-mono text-xs text-red-300">{error}</p>
              {processData?.cacheWarning && (
                <p className="font-mono text-[9px] uppercase text-red-600 tracking-widest mt-2">
                  Exibindo última informação disponível em cache.
                </p>
              )}
            </div>
          )}

          {/* Resultado */}
          {processData?.summary && (
            <div className="border-2 border-slate-700">
              <div className="bg-slate-900 px-5 py-3 flex items-center justify-between border-b-2 border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-[10px] uppercase tracking-widest text-[#ccff00]">
                    ANDAMENTO DO PROCESSO
                  </span>
                  {processData.fromCache && (
                    <span className="bg-amber-500 text-slate-950 font-mono font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
                      CACHE
                    </span>
                  )}
                  {processData.noChanges && (
                    <span className="font-mono font-black text-[9px] uppercase tracking-widest text-slate-500">
                      SEM NOVIDADES
                    </span>
                  )}
                </div>
                {processData.lastCheck && (
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                    ATUALIZADO: {formatDate(processData.lastCheck)}
                  </span>
                )}
              </div>

              <div className="px-5 py-3 border-b-2 border-slate-700 bg-slate-800 flex gap-6 flex-wrap">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400">PROCESSO</p>
                  <p className="font-mono text-xs text-white">{processData.processNumber}</p>
                </div>
                {processData.lastMovDate && (
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400">ÚLTIMA MOVIMENTAÇÃO</p>
                    <p className="font-mono text-xs text-white">{formatDate(processData.lastMovDate)}</p>
                  </div>
                )}
                {processData.lastMovCount && (
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400">TOTAL MOVIMENTAÇÕES</p>
                    <p className="font-mono text-xs text-white">{processData.lastMovCount}</p>
                  </div>
                )}
              </div>

              <div className="p-5">
                <p className="font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {processData.summary}
                </p>
              </div>

              <div className="px-5 pb-3">
                <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                  ⚠️ Resumo gerado automaticamente via Previando. Para dúvidas jurídicas, consulte o advogado.
                </p>
              </div>

              <div className="border-t-2 border-slate-700 p-4 flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 text-center bg-slate-800 border-2 border-slate-600 text-slate-300 font-mono font-black uppercase tracking-widest text-[10px] py-3 hover:border-slate-400 transition-colors"
                >
                  {copied ? '✓ COPIADO' : '📋 COPIAR RESUMO'}
                </button>
                {caseInfo?.client.phone ? (
                  <button
                    onClick={handleWhatsApp}
                    className="flex-1 text-center bg-[#ccff00] border-2 border-black text-slate-950 font-mono font-black uppercase tracking-widest text-[10px] py-3 hover:bg-[#b3ff00] transition-colors"
                  >
                    💬 ENVIAR WHATSAPP
                  </button>
                ) : (
                  <div className="relative group flex-1">
                    <button
                      disabled
                      className="w-full text-center border-2 border-dashed border-slate-700 text-slate-600 font-mono font-black uppercase tracking-widest text-[10px] py-3 cursor-not-allowed"
                    >
                      💬 ENVIAR WHATSAPP
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                      <div className="bg-slate-950 text-[#ccff00] font-mono text-[9px] uppercase tracking-widest px-3 py-2 border border-[#ccff00] whitespace-nowrap">
                        CADASTRE O WHATSAPP DO CLIENTE PRIMEIRO
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleConsult}
                  disabled={consulting}
                  className="border-2 border-slate-600 text-slate-400 font-mono font-black text-[10px] px-4 py-3 hover:border-slate-400 transition-colors disabled:opacity-50"
                >
                  🔄
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
