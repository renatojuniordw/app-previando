'use client'

import { useState, useMemo } from 'react'
import { BookOpen, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GLOSSARY, type GlossaryEntry } from '@/lib/glossary'

export function PortalGlossary() {
  const [search, setSearch] = useState('')
  const [openTerm, setOpenTerm] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return GLOSSARY
    const q = search.toLowerCase()
    return GLOSSARY.filter(
      (entry) =>
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q)
    )
  }, [search])

  const grouped = useMemo(() => {
    const map: Record<string, GlossaryEntry[]> = {}
    for (const entry of filtered) {
      if (!map[entry.category]) map[entry.category] = []
      map[entry.category].push(entry)
    }
    return map
  }, [filtered])

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <BookOpen className="w-4 h-4" aria-hidden="true" />
        <span className="font-sans text-sm font-medium uppercase tracking-wide">
          Glossário de Termos
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar termo..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
        />
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([category, entries]) => (
          <div key={category}>
            <p className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-2">
              {category}
            </p>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {entries.map((entry) => (
                <div key={entry.term}>
                  <button
                    onClick={() => setOpenTerm(openTerm === entry.term ? null : entry.term)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="font-sans text-sm font-semibold text-slate-700">
                        {entry.term}
                      </span>
                      {entry.abbreviation && (
                        <span className="font-sans text-xs text-slate-400 ml-2">
                          ({entry.abbreviation})
                        </span>
                      )}
                    </div>
                    {openTerm === entry.term ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      openTerm === entry.term ? 'max-h-96' : 'max-h-0'
                    )}
                  >
                    <p className="font-sans text-sm text-slate-500 leading-relaxed px-4 pb-3">
                      {entry.definition}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">
          Nenhum termo encontrado para &quot;{search}&quot;
        </p>
      )}
    </div>
  )
}
