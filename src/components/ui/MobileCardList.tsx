import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface CardField {
  label?: string
  value: React.ReactNode
  className?: string
}

interface MobileCard {
  id: string
  primary: React.ReactNode
  secondary?: React.ReactNode
  fields: CardField[]
  badge?: React.ReactNode
  href?: string
  onClick?: () => void
  actions?: React.ReactNode
}

interface MobileCardListProps {
  cards: MobileCard[]
  className?: string
}

export function MobileCardList({ cards, className }: MobileCardListProps) {
  if (cards.length === 0) return null

  return (
    <div className={cn('space-y-2 md:hidden', className)}>
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm active:bg-slate-50 transition-colors"
        >
          <div
            className={cn(
              'p-4',
              (card.onClick || card.href) && 'cursor-pointer'
            )}
            onClick={card.onClick}
            role={card.onClick ? 'button' : undefined}
            tabIndex={card.onClick ? 0 : undefined}
            onKeyDown={card.onClick ? (e) => { if (e.key === 'Enter') card.onClick?.() } : undefined}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sans font-semibold text-sm text-slate-900 leading-snug">
                    {card.primary}
                  </span>
                  {card.badge && (
                    <span className="shrink-0">{card.badge}</span>
                  )}
                </div>
                {card.secondary && (
                  <p className="font-sans text-xs text-slate-500 leading-snug">
                    {card.secondary}
                  </p>
                )}
              </div>
              {(card.onClick || card.href) && (
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
              )}
            </div>

            {card.fields.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {card.fields.map((field, i) => (
                  <div key={i} className={field.className}>
                    {field.label && (
                      <p className="font-sans text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {field.label}
                      </p>
                    )}
                    <p className="font-sans text-xs text-slate-700 font-medium mt-0.5 leading-snug">
                      {field.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {card.actions && (
            <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-end gap-1 bg-slate-50/50">
              {card.actions}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
