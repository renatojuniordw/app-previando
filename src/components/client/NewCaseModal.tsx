'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { BENEFIT_SHORT_LABELS } from '@/lib/constants'
import { useCnis } from '@/hooks/useCnis'
import { isProcessingStatus } from '@/lib/cnis-status'
import type { NewCaseInput } from '@/hooks/useClientDetail'

const caseSchema = z.object({
  benefitType: z.string().min(1, 'Selecione o tipo de benefício'),
  priority: z.enum(['CRITICAL', 'ATTENTION', 'NORMAL']).default('NORMAL'),
  notes: z.string().optional(),
})
type CaseForm = z.infer<typeof caseSchema>

interface Props {
  clientId: string
  open: boolean
  onClose: () => void
  onCreate: (data: NewCaseInput) => Promise<void>
}

export function NewCaseModal({ clientId, open, onClose, onCreate }: Props) {
  const { cnis, loading: cnisLoading } = useCnis(clientId)
  const [creating, setCreating] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CaseForm>({
    resolver: zodResolver(caseSchema),
  })

  const close = () => {
    onClose()
    reset()
  }

  const submit = async (data: CaseForm) => {
    setCreating(true)
    try {
      await onCreate(data)
      close()
    } finally {
      setCreating(false)
    }
  }

  const cnisReady = !!cnis && !isProcessingStatus(cnis.processingStatus) && cnis.processingStatus !== 'FAILED'

  return (
    <Modal open={open} onClose={close} title="Novo Processo">
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        {!cnisLoading && (
          cnisReady ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <p className="font-sans text-xs font-medium text-emerald-700">
                O CNIS deste cliente já está pronto e será usado automaticamente para alimentar os cálculos deste novo caso.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              <p className="font-sans text-xs font-medium text-amber-700">
                {cnis
                  ? 'O CNIS deste cliente ainda está em processamento. O caso pode ser criado, mas alguns cálculos e simulações só ficarão disponíveis quando o extrato terminar de ser lido.'
                  : 'Este cliente ainda não tem CNIS cadastrado. Você pode criar o caso, mas recomendamos enviar o extrato na tela do cliente primeiro — ele alimenta automaticamente os cálculos e simulações de todos os casos.'}
              </p>
            </div>
          )
        )}

        <div>
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Tipo de Benefício</label>
          <select
            {...register('benefitType')}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
          >
            <option value="">Selecione...</option>
            {Object.entries(BENEFIT_SHORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.benefitType && (
            <p className="mt-1 font-sans text-xs text-red-500 font-medium">{errors.benefitType.message}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Prioridade</label>
          <select
            {...register('priority')}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
          >
            <option value="NORMAL">Normal — Padrão</option>
            <option value="ATTENTION">Atenção — Prioridade Média</option>
            <option value="CRITICAL">Crítico — Prioridade Alta (Urgente)</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Observações</label>
          <textarea
            {...register('notes')}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all min-h-[90px] resize-none"
            placeholder="Detalhes adicionais do caso..."
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={close} className="flex-1 font-sans font-bold text-xs h-10">Cancelar</Button>
          <Button type="submit" loading={creating} className="flex-1 bg-slate-900 hover:bg-slate-850 border-slate-900 font-sans font-bold text-xs h-10 shadow-sm text-white">
            Criar Caso
          </Button>
        </div>
      </form>
    </Modal>
  )
}
