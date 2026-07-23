'use client'

import { ArrowRight, X } from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface MobileSearchOverlayProps {
  open: boolean
  onClose: () => void
}

export const MobileSearchOverlay = memo(function MobileSearchOverlay({
  open,
  onClose,
}: MobileSearchOverlayProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/cases?search=${encodeURIComponent(searchQuery.trim())}`)
      onClose()
    }
  }, [router, searchQuery, onClose])

  const handleSearchClick = useCallback(() => {
    router.push(`/cases?search=${encodeURIComponent(searchQuery.trim())}`)
    onClose()
  }, [router, searchQuery, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-white sm:hidden">
      <div className="flex items-center gap-3 p-4 border-b border-slate-200">
        <button
          onClick={() => { setSearchQuery(''); onClose() }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500"
          aria-label="Cancelar pesquisa"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Pesquisar casos, clientes..."
            aria-label="Pesquisar"
            className="w-full py-2.5 text-base font-sans bg-transparent border-0 outline-none placeholder:text-slate-400 text-slate-900"
          />
        </div>
        {searchQuery.trim() && (
          <button
            onClick={handleSearchClick}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-amber-600 text-white rounded-lg transition-colors"
            aria-label="Pesquisar"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
      {searchQuery.trim() && (
        <div className="p-4">
          <p className="font-sans text-sm text-slate-500">
            Pressione Enter ou toque na seta para pesquisar por &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
})
