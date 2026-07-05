import { cn } from '@/lib/utils'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageError } from '@/components/ui/PageError'
import type { LucideIcon } from 'lucide-react'

export interface AdminTableColumn<T> {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  className?: string
  render: (row: T) => React.ReactNode
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyIcon?: LucideIcon
  emptyTitle: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  className?: string
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' }

export function AdminTable<T>({
  columns,
  data,
  rowKey,
  loading,
  error,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  className,
}: AdminTableProps<T>) {
  return (
    <div className={cn('bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden', className)}>
      {loading ? (
        <div className="p-6">
          <TableSkeleton rows={5} columns={columns.length} />
        </div>
      ) : error ? (
        <PageError title="Erro ao carregar dados" reset={onRetry} />
      ) : data.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-5 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider',
                      alignClass[col.align ?? 'left']
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-5 py-4', alignClass[col.align ?? 'left'], col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
