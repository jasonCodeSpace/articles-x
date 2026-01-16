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
    <div className="flex items-center justify-center gap-3 p-3 bg-transparent border-b border-gray-700/50">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search articles by title..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              handleSearchChange(e.target.value)
            }}
            className="pl-10 pr-4 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-blue-400 text-center rounded-full"
            disabled={isLoading}
          />
        </div>
      </form>
      
      {/* Sort Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSortChange(sortBy === 'latest' ? 'hot' : 'latest')}
        className="flex items-center gap-2 rounded-full flex-shrink-0"
      >
        {sortBy === 'latest' ? (
          <>
            <Clock className="h-4 w-4" />
            Latest
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4" />
            Hot
          </>
        )}
      </Button>
    </div>
  )
}