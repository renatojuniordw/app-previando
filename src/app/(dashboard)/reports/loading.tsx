import { TableSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Relatórios</h1>
        <p className="font-sans text-sm text-slate-500 mt-1">Carregando relatórios...</p>
        <div className="mt-6">
          <TableSkeleton rows={5} columns={4} />
        </div>
      </div>
    </div>
  )
}
