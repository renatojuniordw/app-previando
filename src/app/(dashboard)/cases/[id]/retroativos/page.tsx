'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

interface Retroativo {
  id: string
  competencia: string
  valor: number
  status: string
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  PAGO: 'Pago',
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function RetroativosPage() {
  const params = useParams()
  const [retroativos, setRetroativos] = useState<Retroativo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [competencia, setCompetencia] = useState('')
  const [valor, setValor] = useState('')
  const [formError, setFormError] = useState('')

  const load = () => {
    api.get(`/cases/${params.id}/retroativos`)
      .then((r) => setRetroativos(r.data.retroativos ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [params.id])

  const handleCreate = async () => {
    if (!competencia || !valor) { setFormError('Preencha todos os campos.'); return }
    const valorNum = parseFloat(valor.replace(',', '.'))
    if (isNaN(valorNum) || valorNum <= 0) { setFormError('Valor inválido.'); return }
    setCreating(true)
    setFormError('')
    try {
      await api.post(`/cases/${params.id}/retroativos`, { competencia, valor: valorNum })
      setShowModal(false)
      setCompetencia('')
      setValor('')
      load()
    } catch {
      // noop
    } finally {
      setCreating(false)
    }
  }

  const total = retroativos.reduce((acc, r) => acc + r.valor, 0)

  if (loading) {
    return <div className="font-mono text-slate-400 animate-pulse">Carregando...</div>
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono font-black text-white uppercase">Retroativos</h2>
          {retroativos.length > 0 && (
            <p className="font-mono text-xs text-[#ccff00]">Total: {formatBRL(total)}</p>
          )}
        </div>
        <Button onClick={() => setShowModal(true)}>+ NOVO RETROATIVO</Button>
      </div>

      {retroativos.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-700">
          <div className="text-4xl mb-3">💰</div>
          <p className="font-mono text-slate-400 text-sm">Nenhum retroativo calculado.</p>
          <Button size="sm" onClick={() => setShowModal(true)} className="mt-4">
            + ADICIONAR
          </Button>
        </div>
      ) : (
        <div className="border-2 border-slate-700">
          <div className="bg-slate-900 px-4 py-2 border-b-2 border-slate-700 grid grid-cols-4 font-mono font-black text-[10px] uppercase tracking-widest text-slate-400">
            <span>COMPETÊNCIA</span>
            <span>VALOR</span>
            <span>STATUS</span>
            <span>ADICIONADO</span>
          </div>
          {retroativos.map((r) => (
            <div key={r.id} className="px-4 py-3 border-b border-slate-800 grid grid-cols-4 font-mono text-sm">
              <span className="text-white">{r.competencia}</span>
              <span className="text-[#ccff00] font-bold">{formatBRL(r.valor)}</span>
              <span className={`text-xs uppercase ${r.status === 'PAGO' ? 'text-green-400' : r.status === 'CONFIRMADO' ? 'text-blue-400' : 'text-slate-400'}`}>
                {STATUS_LABELS[r.status] ?? r.status}
              </span>
              <span className="text-slate-400 text-xs">{formatDate(r.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="NOVO RETROATIVO">
        <div className="space-y-4">
          <div>
            <label className="neo-label">Competência</label>
            <input
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="neo-input"
              placeholder="Ex: 01/2024 ou Jan/2024"
            />
          </div>
          <div>
            <label className="neo-label">Valor (R$)</label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="neo-input"
              placeholder="Ex: 1500,00"
            />
          </div>
          {formError && <p className="font-mono text-xs text-red-400">{formError}</p>}
          <div className="flex gap-3">
            <Button onClick={handleCreate} loading={creating} className="flex-1">ADICIONAR</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">CANCELAR</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
