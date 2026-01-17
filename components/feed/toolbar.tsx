'use client'

import { Button } from '@/components/ui/button'
import { Clock, TrendingUp, Calendar, Globe } from 'lucide-react'
import { SearchBar } from './search-bar'
import { FilterDropdown } from './filter-dropdown'
import { ActiveFilters } from './active-filters'
import { TIME_PERIODS, LANGUAGES, type TimePeriod, type DisplayLanguage } from './constants'

export interface FeedToolbarProps {
  onSearchChange: (search: string) => void
  searchValue: string
  isLoading?: boolean
  sortBy: 'latest' | 'hot'
  onSortChange: (sort: 'latest' | 'hot') => void
  selectedTimePeriod?: TimePeriod
  onTimePeriodChange?: (period: TimePeriod) => void
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
  displayLanguage = 'en',
  onLanguageChange,
  totalItems
}: FeedToolbarProps) {
  const handleSortToggle = () => {
    onSortChange(sortBy === 'latest' ? 'hot' : 'latest')
  }

  const hasActiveFilters = selectedTimePeriod !== 'all'

  return (
    <div className="space-y-4">
      {/* Main toolbar row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-4 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-2xl">
        {/* Search Bar */}
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          isLoading={isLoading}
        />

        {/* Filters row */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Language Toggle */}
          {onLanguageChange && (
            <FilterDropdown
              icon={<Globe className="h-3.5 w-3.5 shrink-0" />}
              label="Language"
              selectedValue={displayLanguage}
              options={LANGUAGES.map(l => ({ value: l.value as string, label: l.label }))}
              onSelect={(val) => onLanguageChange(val as DisplayLanguage)}
              width="w-32"
            />
          )}

          {/* Time Period Filter */}
          {onTimePeriodChange && (
            <FilterDropdown
              icon={<Calendar className="h-3.5 w-3.5 shrink-0" />}
              label="Time Period"
              selectedValue={selectedTimePeriod}
              options={TIME_PERIODS.map(p => ({ value: p.value as string, label: p.label }))}
              onSelect={(val) => onTimePeriodChange(val as TimePeriod)}
              onClear={() => onTimePeriodChange('all')}
              width="w-44"
            />
          )}

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-white/10" />

          {/* Sort Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSortToggle}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-3 sm:px-4 h-10"
          >
            {sortBy === 'latest' ? (
              <>
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold">Latest</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold">Hot</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results count & active filters indicator */}
      {(totalItems !== undefined || hasActiveFilters) && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            {totalItems !== undefined && (
              <span className="text-[11px] text-white/30">
                {totalItems} {totalItems === 1 ? 'article' : 'articles'}
              </span>
            )}
            {onTimePeriodChange && (
              <ActiveFilters
                selectedTimePeriod={selectedTimePeriod}
                onClearTimePeriod={() => onTimePeriodChange?.('all')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
