import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { PRIORITY_LABELS } from '@/lib/constants'
import type { ClientDetail } from '@/hooks/useClientDetail'

interface Props {
  client: ClientDetail
}

export function ClientPersonalInfoCard({ client }: Props) {
  const hasAddress = [client.street, client.city].some(Boolean)

  return (
    <Card variant="light" className="p-6 border-slate-200/80">
      <h2 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-3 mb-4">
        Dados do Segurado
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm font-sans">
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

      {client.notes && (
        <div className="mt-6 p-4 border border-slate-200/80 bg-slate-50/50 rounded-xl font-sans text-xs text-slate-700 leading-relaxed font-medium">
          <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Observações Internas</span>
          {client.notes}
        </div>
      )}
    </Card>
  )
}
