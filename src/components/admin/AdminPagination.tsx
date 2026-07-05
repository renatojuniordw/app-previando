import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AdminPaginationProps {
  page: number
  pages: number
  total: number
  itemLabel: string
  onChange: (page: number) => void
}

export function AdminPagination({ page, pages, total, itemLabel, onChange }: AdminPaginationProps) {
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-sm text-slate-500">
        {total} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Página anterior"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <span className="font-sans text-sm text-slate-700 font-medium" aria-live="polite">
          {page}/{pages}
        </span>
        <button
          onClick={() => onChange(Math.min(pages, page + 1))}
          disabled={page === pages}
          aria-label="Próxima página"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
