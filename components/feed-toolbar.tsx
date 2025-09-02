'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, TrendingUp, Clock, Globe, Languages } from 'lucide-react'

interface FeedToolbarProps {
  onSearchChange: (search: string) => void
  searchValue: string
  isLoading?: boolean
  sortBy: 'latest' | 'hot'
  onSortChange: (sort: 'latest' | 'hot') => void
  language: 'original' | 'english'
  onLanguageChange: (language: 'original' | 'english') => void
}

export function FeedToolbar({
  onSearchChange,
  searchValue,
  isLoading = false,
  sortBy,
  onSortChange,
  language,
  onLanguageChange
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
    <div className="flex flex-col gap-3 items-center justify-center p-3 bg-transparent border-b border-gray-700/50">
      {/* Centered Search */}
      <form onSubmit={handleSearchSubmit} className="w-full max-w-md sm:max-w-sm">
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
      
      {/* Button Row - Side by side on all screen sizes */}
      <div className="flex flex-row gap-3 items-center justify-center">
        {/* Sort Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortChange(sortBy === 'latest' ? 'hot' : 'latest')}
          className="flex items-center gap-2 rounded-full"
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
        
        {/* Language Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLanguageChange(language === 'original' ? 'english' : 'original')}
          className="flex items-center gap-2 rounded-full"
        >
          {language === 'original' ? (
            <>
              <Globe className="h-4 w-4" />
              Original
            </>
          ) : (
            <>
              <Languages className="h-4 w-4" />
              English
            </>
          )}
        </Button>
      </div>
    </div>
  )
}