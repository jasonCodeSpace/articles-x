'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, TrendingUp, Clock } from 'lucide-react'

interface FeedToolbarProps {
  onSearchChange: (search: string) => void
  searchValue: string
  isLoading?: boolean
  sortBy: 'latest' | 'hot'
  onSortChange: (sort: 'latest' | 'hot') => void
}

export function FeedToolbar({
  onSearchChange,
  searchValue,
  isLoading = false,
  sortBy,
  onSortChange
}: FeedToolbarProps) {
  const [searchInput, setSearchInput] = useState(searchValue)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(searchInput)
  }

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      onSearchChange(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  return (
    <div className="flex items-center justify-between gap-6 p-4 bg-[#0A0A0A]/80 backdrop-blur-2xl border-b border-white/5 mx-auto max-w-7xl">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/50 transition-colors" />
          <Input
            type="text"
            placeholder="Search articles by title..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              handleSearchChange(e.target.value)
            }}
            className="pl-12 pr-4 bg-white/[0.03] border-white/5 text-white placeholder:text-white/20 focus:border-white/20 focus:ring-0 transition-all rounded-2xl"
            disabled={isLoading}
          />
        </div>
      </form>

      {/* Sort Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSortChange(sortBy === 'latest' ? 'hot' : 'latest')}
        className="flex items-center gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-4"
      >
        {sortBy === 'latest' ? (
          <>
            <Clock className="h-4 w-4" />
            <span className="text-[11px] uppercase tracking-widest font-bold">Latest</span>
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4" />
            <span className="text-[11px] uppercase tracking-widest font-bold">Hot</span>
          </>
        )}
      </Button>
    </div>
  )
}