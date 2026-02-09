'use client'

import { Button } from '@/components/ui/button'
import { Clock, TrendingUp } from 'lucide-react'
import { SearchBar } from './search-bar'
import { SimpleCategoryFilter } from './simple-category-filter'
import type { TimePeriod, DisplayLanguage } from './constants'

export interface FeedToolbarProps {
  onSearchChange: (search: string) => void
  searchValue: string
  isLoading?: boolean
  sortBy: 'latest' | 'hot'
  onSortChange: (sort: 'latest' | 'hot') => void
  selectedTimePeriod?: TimePeriod
  onTimePeriodChange?: (period: TimePeriod) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  displayLanguage?: DisplayLanguage
  onLanguageChange?: (language: DisplayLanguage) => void
  totalItems?: number
}

export function FeedToolbar({
  onSearchChange,
  searchValue,
  isLoading = false,
  sortBy,
  onSortChange,
  selectedTimePeriod = 'all',
  onTimePeriodChange,
  selectedCategory = 'all',
  onCategoryChange,
  displayLanguage = 'en',
  onLanguageChange,
  totalItems
}: FeedToolbarProps) {
  const handleSortToggle = () => {
    onSortChange(sortBy === 'latest' ? 'hot' : 'latest')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex-1">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            isLoading={isLoading}
          />
        </div>

        <div className="flex items-center gap-2">
          <SimpleCategoryFilter
            selectedCategory={selectedCategory || 'all'}
            onCategoryChange={(val) => onCategoryChange?.(val)}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSortToggle}
            className="flex items-center gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-4 h-10"
          >
            {sortBy === 'latest' ? (
              <>
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-bold">Latest</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-bold">Hot</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {totalItems !== undefined && (
        <div className="text-[11px] text-white/30">
          {totalItems} {totalItems === 1 ? 'article' : 'articles'}
        </div>
      )}
    </div>
  )
}
