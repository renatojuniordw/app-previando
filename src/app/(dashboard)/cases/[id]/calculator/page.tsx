'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

interface Calculation {
  id: string
  modalidade: string
  inputData: Record<string, unknown>
  resultData: Record<string, unknown> | null
  isSelected: boolean
  createdAt: string
}

const MODALIDADE_LABELS: Record<string, string> = {
  IDADE: 'Aposentadoria por Idade',
  TEMPO_CONTRIBUICAO: 'Tempo de Contribuição',
  ESPECIAL: 'Aposentadoria Especial',
  HIBRIDA: 'Aposentadoria Híbrida',
  PONTOS: 'Aposentadoria por Pontos',
  BENEFICIO_DOENCA: 'Benefício por Doença',
  BPC_LOAS: 'BPC/LOAS',
  PENSAO_MORTE: 'Pensão por Morte',
  SALARIO_MATERNIDADE: 'Salário-Maternidade',
}

export default function CalculatorPage() {
  const params = useParams()
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [modalidade, setModalidade] = useState('IDADE')
  const [inputJson, setInputJson] = useState('{}')
  const [jsonError, setJsonError] = useState('')

  const load = () => {
    api.get(`/cases/${params.id}/calculations`)
      .then((r) => setCalculations(r.data.calculations ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [params.id])

  const handleCreate = async () => {
    let inputData: Record<string, unknown>
    try {
      inputData = JSON.parse(inputJson)
    } catch {
      setJsonError('JSON inválido.')
      return
    }
    setCreating(true)
    try {
      await api.post(`/cases/${params.id}/calculations`, { modalidade, inputData })
      setShowModal(false)
      setInputJson('{}')
      load()
    } catch {
      // noop
    } finally {
      setCreating(false)
    }
  }

  const handleSelect = async (calcId: string) => {
    try {
      await api.patch(`/cases/${params.id}/calculations/${calcId}/select`)
      load()
    } catch {
      // noop
    }
  }

  const handleDelete = async (calcId: string) => {
    try {
      await api.delete(`/cases/${params.id}/calculations/${calcId}`)
      load()
    } catch {
      // noop
    }
  }

  if (loading) {
    return <div className="font-mono text-slate-400 animate-pulse">Carregando...</div>
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-mono font-black text-white uppercase">Calculadora</h2>
        <Button onClick={() => setShowModal(true)}>+ NOVO CÁLCULO</Button>
      </div>

      {calculations.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-700">
          <div className="text-4xl mb-3">🧮</div>
          <p className="font-mono text-slate-400 text-sm">Nenhum cálculo realizado.</p>
          <Button size="sm" onClick={() => setShowModal(true)} className="mt-4">
            + CALCULAR
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {calculations.map((calc) => (
            <div key={calc.id} className={`border-2 p-4 ${calc.isSelected ? 'border-[#ccff00]' : 'border-slate-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-mono font-bold text-sm text-white">
                    {MODALIDADE_LABELS[calc.modalidade] ?? calc.modalidade}
                  </p>
                  <p className="font-mono text-xs text-slate-400">{formatDate(calc.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {calc.isSelected && (
                    <span className="font-mono font-black text-[10px] uppercase tracking-widest text-[#ccff00] border border-[#ccff00] px-2 py-0.5">
                      SELECIONADO
                    </span>
                  )}
                  {!calc.isSelected && (
                    <button
                      onClick={() => handleSelect(calc.id)}
                      className="font-mono text-[10px] uppercase tracking-widest border-2 border-slate-600 text-slate-400 px-3 py-1 hover:border-[#ccff00] hover:text-[#ccff00] transition-colors"
                    >
                      SELECIONAR
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(calc.id)}
                    className="font-mono text-[10px] uppercase tracking-widest border-2 border-red-800 text-red-400 px-3 py-1 hover:border-red-500 transition-colors"
                  >
                    EXCLUIR
                  </button>
                </div>
              </div>
              {calc.resultData && (
                <div className="mt-2 p-3 bg-slate-800 border border-slate-700">
                  <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-48">
                    {JSON.stringify(calc.resultData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="NOVO CÁLCULO">
        <div className="space-y-4">
          <div>
            <label className="neo-label">Modalidade</label>
            <select value={modalidade} onChange={(e) => setModalidade(e.target.value)} className="neo-input">
              {Object.entries(MODALIDADE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="neo-label">Dados de Entrada (JSON)</label>
            <textarea
              value={inputJson}
              onChange={(e) => { setInputJson(e.target.value); setJsonError('') }}
              className="neo-input min-h-[120px] resize-none font-mono text-xs"
              placeholder='{"dataNascimento": "1965-01-15", ...}'
            />
            {jsonError && <p className="mt-1 font-mono text-xs text-red-400">{jsonError}</p>}
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCreate} loading={creating} className="flex-1">CALCULAR</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">CANCELAR</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
