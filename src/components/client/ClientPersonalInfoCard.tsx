'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { PRIORITY_LABELS } from '@/lib/constants'
import { ChevronDown, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientDetail } from '@/hooks/useClientDetail'

interface Props {
  client: ClientDetail
  onEditNotes?: () => void
}

export function ClientPersonalInfoCard({ client, onEditNotes }: Props) {
  const [expanded, setExpanded] = useState(true)
  const hasAddress = [client.street, client.city].some(Boolean)

  return (
    <Card variant="light" className="p-4 sm:p-6 border-slate-200/80">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full border-b border-slate-100 pb-3"
        aria-expanded={expanded}
      >
        <h2 className="font-serif font-bold text-lg text-slate-900">Dados do Segurado</h2>
        <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform duration-200', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-sm font-sans">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data de Nascimento</span>
            <p className="text-slate-800 font-semibold mt-1">{formatDate(client.birthDate)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefone</span>
            <p className="text-slate-800 font-semibold mt-1">{client.phone ?? '—'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</span>
            <p className="text-slate-800 font-semibold mt-1 truncate">{client.email ?? '—'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado Civil</span>
            <p className="text-slate-800 font-semibold mt-1">
              {client.maritalStatus ? client.maritalStatus.charAt(0).toUpperCase() + client.maritalStatus.slice(1) : '—'}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profissão</span>
            <p className="text-slate-800 font-semibold mt-1">{client.profession ?? '—'}</p>
          </div>
          <div className="lg:col-span-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Endereço Completo</span>
            <p className="text-slate-800 font-semibold mt-1 leading-relaxed">
              {[client.street, client.streetNumber].filter(Boolean).join(', ')}
              {client.complement ? ` - ${client.complement}` : ''}
              {client.neighborhood ? `, ${client.neighborhood}` : ''}
              {client.city ? `, ${client.city}` : ''}
              {client.state ? ` - ${client.state}` : ''}
              {client.zipCode ? `, CEP ${client.zipCode}` : ''}
              {!hasAddress && '—'}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prioridade</span>
            <div className="mt-1">
              <Badge variant={client.priority === 'CRITICAL' ? 'red' : client.priority === 'ATTENTION' ? 'yellow' : 'slate'}>
                {PRIORITY_LABELS[client.priority] ?? client.priority}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {(client.notes || onEditNotes) && (
        <div className="mt-4 p-4 border border-slate-200/80 bg-slate-50/50 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Observações Internas</span>
            {onEditNotes && (
              <button
                onClick={onEditNotes}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors -mr-2 -my-1"
                aria-label="Editar observações"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          {client.notes ? (
            <p className="font-sans text-xs text-slate-700 leading-relaxed font-medium">{client.notes}</p>
          ) : (
            <p className="font-sans text-xs text-slate-400 italic">Nenhuma observação registrada.</p>
          )}
        </div>
      )}
    </Card>
  )
}
