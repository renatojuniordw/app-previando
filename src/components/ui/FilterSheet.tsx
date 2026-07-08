'use client'

import { useRef } from 'react'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { DatePicker } from '@/components/ui/DatePicker'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterOption {
  type: 'select' | 'text' | 'number' | 'date' | 'chips'
  id: string
  label: string
  options?: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  filters: FilterOption[]
  activeCount: number
  onClear: () => void
  onApply: () => void
}

function renderFilterInput(filter: FilterOption) {
  switch (filter.type) {
    case 'select':
      return (
        <select
          id={filter.id}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
        >
          <option value="">Todos</option>
          {filter.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    case 'text':
      return (
        <input
          id={filter.id}
          type="text"
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          placeholder={filter.placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
        />
      )
    case 'number':
      return (
        <input
          id={filter.id}
          type="number"
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          placeholder={filter.placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
        />
      )
    case 'date':
      return (
        <DatePicker
          value={filter.value || null}
          onChange={(d) => filter.onChange(d ? d.toISOString().split('T')[0] : '')}
        />
      )
    case 'chips':
      return (
        <div className="flex flex-wrap gap-2">
          {filter.options?.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => filter.onChange(filter.value === opt.value ? '' : opt.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg border transition-all',
                filter.value === opt.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )
    default:
      return null
  }
}

export function FilterSheet({ open, onClose, title = 'Filtros', filters, activeCount, onClear, onApply }: FilterSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(open)
  useFocusTrap(open, sheetRef)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full bg-white shadow-2xl animate-slide-up',
          'sm:max-w-lg sm:rounded-2xl sm:mx-4 sm:mb-0',
          'rounded-t-2xl max-h-[85dvh] overflow-y-auto'
        )}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-2xl px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-serif font-bold text-lg text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {filters.map((filter) => (
            <div key={filter.id}>
              <label
                htmlFor={filter.type !== 'chips' ? filter.id : undefined}
                className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2"
              >
                {filter.label}
              </label>
              {renderFilterInput(filter)}
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 flex items-center gap-3">
          <button
            onClick={onClear}
            className="flex-1 h-10 text-xs font-bold text-red-600 hover:text-red-750 border border-slate-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Limpar {activeCount > 0 && `(${activeCount})`}
          </button>
          <button
            onClick={onApply}
            className="flex-1 h-10 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-900 rounded-lg shadow-sm transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
