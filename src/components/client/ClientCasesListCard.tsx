import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate, cn } from '@/lib/utils'
import { BENEFIT_SHORT_LABELS, STATUS_LABELS, PRIORITY_LABELS, BENEFIT_DB_LABELS } from '@/lib/constants'
import type { ClientCaseSummary } from '@/hooks/useClientDetail'

const getCaseStatusLabel = (status: string) => {
  const dbToLabel: Record<string, string> = {
    PROSPECTING: 'Prospecção',
    ANALYSIS: 'Análise',
    READY_TO_REQUEST: 'Pronto p/ Requerer',
    PROCESSING: 'Em Processamento',
    FINISHED: 'Finalizado',
  }
  return dbToLabel[status] ?? STATUS_LABELS[status] ?? status
}

const getCaseStatusVariant = (status: string) => {
  const upper = status.toUpperCase()
  if (['PROSPECTING', 'PROSPECCAO'].includes(upper)) return 'slate'
  if (['ANALYSIS', 'ANALISE'].includes(upper)) return 'blue'
  if (['READY_TO_REQUEST', 'PRONTO_PARA_REQUERER'].includes(upper)) return 'yellow'
  if (['PROCESSING', 'EM_PROCESSAMENTO'].includes(upper)) return 'lime'
  if (['FINISHED', 'FINALIZADO'].includes(upper)) return 'green'
  return 'slate'
}

interface Props {
  cases: ClientCaseSummary[]
  onNewCase: () => void
}

export function ClientCasesListCard({ cases, onNewCase }: Props) {
  return (
    <Card variant="light" className="p-6 border-slate-200/80 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-serif font-bold text-lg text-slate-900 lowercase">
          processos vinculados ({cases.length})
        </h2>
        <Button size="sm" onClick={onNewCase} className="bg-slate-900 hover:bg-slate-800 text-white border-slate-900 h-9 font-sans font-bold text-xs shadow-sm">
          + Adicionar Processo
        </Button>
      </div>

      {cases.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/20 rounded-xl">
          <FileText className="w-8 h-8 text-slate-350 mx-auto mb-2" />
          <p className="font-sans text-slate-500 text-sm font-medium">Nenhum caso cadastrado para este cliente.</p>
          <Button size="sm" onClick={onNewCase} className="mt-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8">
            Criar Caso
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((caso) => {
            const isCnisLido = caso.cnisDocument && ['PROCESSED', 'PROCESSADO'].includes(caso.cnisDocument.processingStatus.toUpperCase());
            return (
              <Link key={caso.id} href={`/cases/${caso.id}`} className="block">
                <div className="border border-slate-200/80 bg-white rounded-xl p-5 md:p-6 hover:border-slate-300 hover:shadow-elevation-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-elevation-sm">
                  <div className="space-y-1.5">
                    <p className="font-serif font-bold text-base text-slate-900 group-hover:text-amber-700 transition-colors tracking-tight">
                      {BENEFIT_DB_LABELS[caso.benefitType] ?? BENEFIT_SHORT_LABELS[caso.benefitType] ?? caso.benefitType}
                    </p>
                    <p className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Criado em: {formatDate(caso.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto overscroll-x-contain -mx-1 px-1 scrollbar-none">
                    {caso.cnisDocument && (
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-extrabold uppercase tracking-wider',
                        isCnisLido
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100/60'
                          : 'bg-amber-50 text-amber-700 border-amber-100/60'
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isCnisLido ? 'bg-emerald-500' : 'bg-amber-500')} />
                        CNIS {isCnisLido ? 'Lido' : 'Pendente'}
                      </span>
                    )}
                    <Badge variant={caso.priority === 'CRITICAL' ? 'red' : caso.priority === 'ATTENTION' ? 'yellow' : 'slate'}>
                      {PRIORITY_LABELS[caso.priority] ?? caso.priority}
                    </Badge>
                    <Badge variant={getCaseStatusVariant(caso.status)}>
                      {getCaseStatusLabel(caso.status)}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-slate-350 group-hover:text-slate-700 group-hover:translate-x-1 transition-all duration-300 ml-1 shrink-0" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  )
}
