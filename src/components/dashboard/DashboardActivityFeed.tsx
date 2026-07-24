import { memo } from 'react'
import { Card } from '@/components/ui/Card'
import { FileText, MessageSquare, Scale, StickyNote, Calculator, AlertCircle } from 'lucide-react'
import type { ComponentType } from 'react'
import Link from 'next/link'

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
    <Card variant="light" className="p-0 overflow-hidden flex-1 bg-white border-slate-200 shadow-sm rounded-xl">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-serif font-bold text-base text-slate-900">Atividade Recente</h3>
      </div>
      <div className="p-4 space-y-3.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {notes.length > 0 ? (
          notes.map((note, idx) => {
            const Icon = NOTE_TYPE_ICON[note.type] || FileText
            return (
              <Link
                key={note.id}
                href={`/cases/${note.case.id}`}
                className="relative pl-7 block group hover:bg-slate-50/50 p-2 -ml-2 rounded-lg transition-colors duration-200"
              >
                {idx < notes.length - 1 && (
                  <div className="absolute left-[12px] top-6 bottom-[-22px] w-px bg-slate-100 border-l border-dashed border-slate-200 group-hover:border-slate-300 transition-colors" />
                )}
                <div className="absolute left-[3px] top-3 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-amber-400 group-hover:text-amber-600 transition-colors duration-200 shadow-sm">
                  <Icon className="w-2.5 h-2.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-amber-700 transition-colors duration-200 truncate">{note.case.client.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{note.content}</p>
                </div>
              </Link>
            )
          })
        ) : (
          <p className="text-xs text-slate-400 text-center py-6 font-medium">Nenhuma atividade recente</p>
        )}
      </div>
      {notes.length > 0 && (
        <Link
          href="/activity"
          className="block px-4 py-3 border-t border-slate-100 text-center text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-slate-50/50 transition-colors duration-200"
        >
          Ver toda atividade →
        </Link>
      )}
    </Card>
  )
})
