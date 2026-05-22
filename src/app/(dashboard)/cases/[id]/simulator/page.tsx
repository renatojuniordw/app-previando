'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

interface Simulation {
  id: string
  scenarioName: string
  inputData: Record<string, unknown>
  resultData: Record<string, unknown> | null
  createdAt: string
}

export default function SimulatorPage() {
  const params = useParams()
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [scenarioName, setScenarioName] = useState('')
  const [inputJson, setInputJson] = useState('{}')
  const [jsonError, setJsonError] = useState('')

  const load = () => {
    api.get(`/cases/${params.id}/simulations`)
      .then((r) => setSimulations(r.data.simulations ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [params.id])

  const handleCreate = async () => {
    if (!scenarioName.trim()) { setJsonError('Nome do cenário obrigatório.'); return }
    let inputData: Record<string, unknown>
    try {
      inputData = JSON.parse(inputJson)
    } catch {
      setJsonError('JSON inválido.')
      return
    }
    setCreating(true)
    try {
      await api.post(`/cases/${params.id}/simulations`, { scenarioName, inputData })
      setShowModal(false)
      setScenarioName('')
      setInputJson('{}')
      load()
    } catch {
      // noop
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (simId: string) => {
    try {
      await api.delete(`/cases/${params.id}/simulations/${simId}`)
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
        <h2 className="font-mono font-black text-white uppercase">Simulador</h2>
        <Button onClick={() => setShowModal(true)}>+ NOVA SIMULAÇÃO</Button>
      </div>

      {simulations.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-700">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-mono text-slate-400 text-sm">Nenhuma simulação criada.</p>
          <Button size="sm" onClick={() => setShowModal(true)} className="mt-4">
            + SIMULAR
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {simulations.map((sim) => (
            <div key={sim.id} className="border-2 border-slate-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-mono font-bold text-sm text-white">{sim.scenarioName}</p>
                  <p className="font-mono text-xs text-slate-400">{formatDate(sim.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleDelete(sim.id)}
                  className="font-mono text-[10px] uppercase tracking-widest border-2 border-red-800 text-red-400 px-3 py-1 hover:border-red-500 transition-colors"
                >
                  EXCLUIR
                </button>
              </div>
              {sim.resultData && (
                <div className="mt-2 p-3 bg-slate-800 border border-slate-700">
                  <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-48">
                    {JSON.stringify(sim.resultData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="NOVA SIMULAÇÃO">
        <div className="space-y-4">
          <div>
            <label className="neo-label">Nome do Cenário</label>
            <input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="neo-input"
              placeholder="Ex: Aposentadoria em 2026"
            />
          </div>
          <div>
            <label className="neo-label">Dados (JSON)</label>
            <textarea
              value={inputJson}
              onChange={(e) => { setInputJson(e.target.value); setJsonError('') }}
              className="neo-input min-h-[120px] resize-none font-mono text-xs"
              placeholder='{"dataPretendida": "2026-01-01", ...}'
            />
            {jsonError && <p className="mt-1 font-mono text-xs text-red-400">{jsonError}</p>}
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCreate} loading={creating} className="flex-1">SIMULAR</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">CANCELAR</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
