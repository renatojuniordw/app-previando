'use client'

import { User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface CnisInfoCardProps {
  cnisDocument: {
    extractedData?: {
      nome?: string
      nit?: string
      dataNascimento?: string
      periodos?: Array<unknown>
    }
  } | null
}

export function CnisInfoCard({ cnisDocument }: CnisInfoCardProps) {
  if (!cnisDocument?.extractedData) return null

  const { nome, nit, dataNascimento, periodos } = cnisDocument.extractedData

  return (
    <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-4 space-y-3">
      <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-amber-700 flex items-center gap-1">
        <User className="w-3.5 h-3.5" />
        Segurado Vinculado (CNIS)
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans text-slate-700">
        <div className="sm:col-span-3 pb-1.5 border-b border-amber-100/50">
          <span className="font-bold text-slate-800 text-sm">{nome ?? 'Não informado'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-500 block mb-0.5">NIT</span>
          <span className="text-slate-800 font-medium">{nit ?? 'Não informado'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-500 block mb-0.5">Nascimento</span>
          <span className="text-slate-800 font-medium">
            {dataNascimento ? formatDate(dataNascimento) : 'Não informado'}
          </span>
        </div>
        <div>
          <span className="font-semibold text-slate-500 block mb-0.5">Total Vínculos</span>
          <span className="text-slate-800 font-medium">{periodos?.length ?? 0}</span>
        </div>
      </div>
    </div>
  )
}
