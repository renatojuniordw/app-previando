'use client'

import { usePathname } from 'next/navigation'
import { MessageSquare, CheckSquare, Bot, FileText, BookOpen, Building2, Briefcase } from 'lucide-react'
import { FloatingActionMenu, type FloatingAction } from '@/components/ui/FloatingActionMenu'

interface CaseFloatingActionsProps {
  activeDrawer: string | null
  setDrawer: (drawerName: string | null) => void
  benefitType?: string
}

export function CaseFloatingActions({ activeDrawer, setDrawer, benefitType }: CaseFloatingActionsProps) {
  const pathname = usePathname()
  const isCnisPage = pathname?.includes('/cnis')

  const hintText = isCnisPage
    ? 'Consulte o dicionário de indicadores'
    : 'Acesse ferramentas rápidas'

  const actions: FloatingAction[] = [
    {
      id: 'notes',
      label: 'Prontuário',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 text-slate-600',
      activeColor: 'border-blue-500 text-blue-600 bg-blue-50/30',
      onClick: () => setDrawer(activeDrawer === 'notes' ? null : 'notes'),
      isActive: activeDrawer === 'notes',
    },
    {
      id: 'checklist',
      label: 'Checklist',
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50 text-slate-600',
      activeColor: 'border-emerald-500 text-emerald-600 bg-emerald-50/30',
      onClick: () => setDrawer(activeDrawer === 'checklist' ? null : 'checklist'),
      isActive: activeDrawer === 'checklist',
    },
    {
      id: 'opinions',
      label: 'Parecer IA',
      icon: <Bot className="w-4 h-4" />,
      color: 'hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50 text-slate-600',
      activeColor: 'border-amber-500 text-amber-600 bg-amber-50/30',
      onClick: () => setDrawer(activeDrawer === 'opinions' ? null : 'opinions'),
      isActive: activeDrawer === 'opinions',
    },
    {
      id: 'peticao',
      label: 'Petição Inicial',
      icon: <FileText className="w-4 h-4" />,
      color: 'hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50 text-slate-600',
      activeColor: 'border-amber-500 text-amber-600 bg-amber-50/30',
      onClick: () => setDrawer(activeDrawer === 'peticao' ? null : 'peticao'),
      isActive: activeDrawer === 'peticao',
    },
    {
      id: 'dictionary',
      label: 'Dicionário',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50 text-slate-600',
      onClick: () => setDrawer(activeDrawer === 'dictionary' ? null : 'dictionary'),
      isActive: activeDrawer === 'dictionary',
      show: isCnisPage,
    },
    {
      id: 'bpc',
      label: 'Análises BPC',
      icon: <Building2 className="w-4 h-4" />,
      color: 'hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50/50 text-slate-600',
      activeColor: 'border-purple-500 text-purple-600 bg-purple-50/30',
      onClick: () => setDrawer(activeDrawer === 'bpc' ? null : 'bpc'),
      isActive: activeDrawer === 'bpc',
      show: benefitType === 'BPC_LOAS',
    },
  ]

  return (
    <FloatingActionMenu
      actions={actions}
      triggerIcon={<Briefcase className="w-5 h-5" />}
      triggerLabel="Abrir menu de ferramentas rápidas do caso"
      hintText={hintText}
    />
  )
}
