import { memo } from 'react'
import { Card } from '@/components/ui/Card'
import { FileText, MessageSquare, Scale, StickyNote, Calculator, AlertCircle } from 'lucide-react'
import type { ComponentType } from 'react'

const NOTE_TYPE_ICON: Record<string, ComponentType<{ className?: string }>> = {
  CONTATO: MessageSquare,
  DOCUMENTO: FileText,
  JURIDICO: Scale,
  INTERNO: StickyNote,
  CALCULO: Calculator,
  PENDENCIA: AlertCircle,
}

interface ActivityNote {
  id: string
  type: string
  content: string
  createdAt: string
  case: { id: string; client: { name: string } }
}

export const DashboardActivityFeed = memo(function DashboardActivityFeed({ notes }: { notes: ActivityNote[] }) {
  return (
    <Card variant="light" className="p-0 overflow-hidden flex-1">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h3 className="font-serif font-bold text-base text-slate-900">Atividade Recente</h3>
      </div>
      <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
        {notes.length > 0 ? (
          notes.map((note, idx) => {
            const Icon = NOTE_TYPE_ICON[note.type] || FileText
            return (
              <div key={note.id} className="relative pl-6">
                {idx < notes.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-[-16px] w-px bg-slate-200" />
                )}
                <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex align-items-center justify-content-center text-slate-400">
                  <Icon className="w-2.5 h-2.5" />
                </div>
                <p className="text-xs font-semibold text-slate-800">{note.case.client.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{note.content}</p>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma atividade recente</p>
        )}
      </div>
    </Card>
  )
})
