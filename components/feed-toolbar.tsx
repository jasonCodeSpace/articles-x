'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, TrendingUp, Clock, ChevronDown, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const CATEGORIES = [
  'All',
  'AI', 'Crypto', 'Tech', 'Startups', 'Business', 'Markets',
  'Product', 'Design', 'Security', 'Data', 'Hardware', 'Gaming',
  'Health', 'Environment', 'Culture', 'Philosophy', 'History',
  'Education', 'Marketing', 'Policy', 'Science', 'Media', 'Personal Story'
]

interface FeedToolbarProps {
  onSearchChange: (search: string) => void
  searchValue: string
  isLoading?: boolean
  sortBy: 'latest' | 'hot'
  onSortChange: (sort: 'latest' | 'hot') => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

export function FeedToolbar({
  onSearchChange,
  searchValue,
  isLoading = false,
  sortBy,
  onSortChange,
  selectedCategory = 'All',
  onCategoryChange
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

  const handleCategorySelect = (category: string) => {
    if (onCategoryChange) {
      onCategoryChange(category)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-[#0A0A0A]/80 backdrop-blur-2xl border-b border-white/5 mx-auto max-w-7xl">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/50 transition-colors" />
          <Input
            type="text"
            placeholder="Search articles..."
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

      {/* Category Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-4 min-w-[120px] justify-between"
          >
            <span className="text-[11px] uppercase tracking-widest font-bold truncate">
              {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
            </span>
            {selectedCategory !== 'All' ? (
              <X
                className="h-3 w-3 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCategorySelect('All')
                }}
              />
            ) : (
              <ChevronDown className="h-3 w-3 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="w-48 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 max-h-80 overflow-y-auto custom-scrollbar"
        >
          {CATEGORIES.map((category) => (
            <DropdownMenuItem
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`rounded-lg text-[11px] uppercase tracking-wider cursor-pointer transition-colors ${
                selectedCategory === category
                  ? 'text-white bg-white/10'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {category}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
