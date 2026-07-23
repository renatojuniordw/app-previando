'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Columns,
  CreditCard,
  Settings,
  Activity,
  CalendarDays,
  FolderOpen,
  BookOpen,
  Files,
  BarChart3,
  DollarSign,
  Headphones,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { useSidebarStore } from '@/store/sidebar'
import { useUrgentDeadlines } from '@/hooks/useUrgentDeadlines'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: 'deadlines'
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/clients/list', label: 'Clientes', icon: Users },
      { href: '/clients/kanban', label: 'Kanban', icon: Columns },
      { href: '/cases', label: 'Casos', icon: FolderOpen },
    ],
  },
  {
    label: 'Acompanhamento',
    items: [
      { href: '/reports', label: 'Relatórios', icon: BarChart3 },
      { href: '/honorarios', label: 'Honorários', icon: DollarSign },
      { href: '/calendar', label: 'Agenda', icon: CalendarDays, badge: 'deadlines' as const },
      { href: '/activity', label: 'Atividade', icon: Activity },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { href: '/tools/pdf', label: 'Ferramentas de PDF', icon: Files },
      { href: '/tools/cnis-indicators', label: 'Dicionário CNIS', icon: BookOpen },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { href: '/settings/billing', label: 'Plano', icon: CreditCard },
      { href: '/settings/profile', label: 'Perfil', icon: Settings },
      { href: '/suporte', label: 'Suporte', icon: Headphones },
    ],
  },
]

const ADMIN_SECTION: NavSection = {
  label: 'Administração',
  items: [
    { href: '/admin', label: 'Painel Administrativo', icon: Shield },
  ],
}

const SHORTCUT_LABELS: Record<string, string> = {
  '/dashboard': '⌘1',
  '/clients/list': '⌘2',
  '/cases': '⌘3',
  '/calendar': '⌘4',
}

function renderSectionLabel(label: string, showFull: boolean, className?: string) {
  if (showFull) {
    return (
      <p className={cn('px-3 py-2 text-xs font-semibold uppercase tracking-wider', className ?? 'text-slate-400')}>
        {label}
      </p>
    )
  }
  return (
    <p className={cn('sr-only px-3 py-2 text-xs font-semibold uppercase tracking-wider', className ?? 'text-slate-400')}>
      {label}
    </p>
  )
}

function renderNavItem(item: NavItem, pathname: string, showFull: boolean, urgentDeadlines: number) {
  const active = pathname.startsWith(item.href)
  const Icon = item.icon
  return (
    <li key={item.href}>
      <Link
        href={item.href}
        prefetch={false}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        title={!showFull ? item.label : undefined}
        className={cn(
          'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
          active
            ? 'bg-amber-50 text-amber-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        )}
      >
        <Icon
          className={cn(
            'h-5 w-5 shrink-0',
            active ? 'text-amber-600' : 'text-slate-400'
          )}
          aria-hidden="true"
        />
        {showFull ? (
          <span className="flex-1">{item.label}</span>
        ) : (
          <span className="sr-only">{item.label}</span>
        )}
        {SHORTCUT_LABELS[item.href] && showFull && (
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 rounded">
            {SHORTCUT_LABELS[item.href]}
          </kbd>
        )}
        {item.badge === 'deadlines' && urgentDeadlines > 0 && (
          <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {urgentDeadlines > 9 ? '9+' : urgentDeadlines}
          </span>
        )}
      </Link>
    </li>
  )
}

interface SidebarNavProps {
  isAdmin: boolean
  onNavigate: () => void
}

export function SidebarNav({ isAdmin }: SidebarNavProps) {
  const pathname = usePathname()
  const { isDesktopOpen } = useSidebarStore()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  const showFullSidebar = isDesktopOpen || isMobile
  const urgentDeadlines = useUrgentDeadlines()

  return (
    <>
      {NAV_SECTIONS.map((section) => (
        <li key={section.label}>
          {renderSectionLabel(section.label, showFullSidebar)}
          <ul role="list" className="ml-0 space-y-0.5">
            {section.items.map((item) =>
              renderNavItem(item, pathname, showFullSidebar, urgentDeadlines)
            )}
          </ul>
        </li>
      ))}

      {isAdmin && (
        <li>
          <hr className="my-2 border-slate-200" />
          {renderSectionLabel(ADMIN_SECTION.label, showFullSidebar, 'text-amber-700')}
          <ul role="list" className="ml-0 space-y-0.5">
            {ADMIN_SECTION.items.map((item) =>
              renderNavItem(item, pathname, showFullSidebar, urgentDeadlines)
            )}
          </ul>
        </li>
      )}
    </>
  )
}
