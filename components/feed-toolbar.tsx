'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, TrendingUp, Clock, ChevronDown, X, Calendar, Filter } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { TimePeriod } from '@/hooks/use-article-feed'

const CATEGORIES = [
  'All',
  'AI', 'Crypto', 'Tech', 'Startups', 'Business', 'Markets',
  'Product', 'Design', 'Security', 'Data', 'Hardware', 'Gaming',
  'Health', 'Environment', 'Culture', 'Philosophy', 'History',
  'Education', 'Marketing', 'Policy', 'Science', 'Media', 'Personal Story'
]

const TIME_PERIODS: { value: TimePeriod; label: string; shortLabel: string }[] = [
  { value: 'all', label: 'All Time', shortLabel: 'All' },
  { value: 'today', label: 'Today', shortLabel: 'Today' },
  { value: 'week', label: 'This Week', shortLabel: 'Week' },
  { value: 'month', label: 'This Month', shortLabel: 'Month' },
  { value: '3months', label: 'Last 3 Months', shortLabel: '3M' },
]

interface FeedToolbarProps {
  onSearchChange: (search: string) => void
  searchValue: string
  isLoading?: boolean
  sortBy: 'latest' | 'hot'
  onSortChange: (sort: 'latest' | 'hot') => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  selectedTimePeriod?: TimePeriod
  onTimePeriodChange?: (period: TimePeriod) => void
  totalItems?: number
}

export function FeedToolbar({
  onSearchChange,
  searchValue,
  isLoading = false,
  sortBy,
  onSortChange,
  selectedCategory = 'All',
  onCategoryChange,
  selectedTimePeriod = 'all',
  onTimePeriodChange,
  totalItems
}: FeedToolbarProps) {
  const [searchInput, setSearchInput] = useState(searchValue)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(searchInput)
  }

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
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

  const handleTimePeriodSelect = (period: TimePeriod) => {
    if (onTimePeriodChange) {
      onTimePeriodChange(period)
    }
  }

  const currentTimePeriod = TIME_PERIODS.find(p => p.value === selectedTimePeriod)
  const hasActiveFilters = selectedCategory !== 'All' || selectedTimePeriod !== 'all'

  return (
    <div className="space-y-4">
      {/* Main toolbar row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-4 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-2xl">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0">
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
              className="pl-12 pr-4 bg-white/[0.03] border-white/5 text-white placeholder:text-white/20 focus:border-white/20 focus:ring-0 transition-all rounded-xl h-10"
              disabled={isLoading}
            />
          </div>
        </form>

        {/* Filters row - responsive */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-3 sm:px-4 h-10 min-w-0"
              >
                <Filter className="h-3.5 w-3.5 shrink-0 sm:hidden" />
                <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold truncate max-w-[80px] sm:max-w-[100px]">
                  {selectedCategory === 'All' ? 'Category' : selectedCategory}
                </span>
                {selectedCategory !== 'All' ? (
                  <X
                    className="h-3 w-3 opacity-50 hover:opacity-100 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCategorySelect('All')
                    }}
                  />
                ) : (
                  <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 max-h-80 overflow-y-auto custom-scrollbar"
            >
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/30 px-2 py-1">
                Category
              </DropdownMenuLabel>
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

          {/* Time Period Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-3 sm:px-4 h-10 min-w-0"
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold hidden xs:inline">
                  {currentTimePeriod?.shortLabel || 'All'}
                </span>
                {selectedTimePeriod !== 'all' ? (
                  <X
                    className="h-3 w-3 opacity-50 hover:opacity-100 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTimePeriodSelect('all')
                    }}
                  />
                ) : (
                  <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2"
            >
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/30 px-2 py-1">
                Time Period
              </DropdownMenuLabel>
              {TIME_PERIODS.map((period) => (
                <DropdownMenuItem
                  key={period.value}
                  onClick={() => handleTimePeriodSelect(period.value)}
                  className={`rounded-lg text-[11px] uppercase tracking-wider cursor-pointer transition-colors ${
                    selectedTimePeriod === period.value
                      ? 'text-white bg-white/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {period.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-white/10" />

          {/* Sort Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSortChange(sortBy === 'latest' ? 'hot' : 'latest')}
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
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                {selectedCategory !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50">
                    {selectedCategory}
                    <X
                      className="h-2.5 w-2.5 cursor-pointer hover:text-white"
                      onClick={() => handleCategorySelect('All')}
                    />
                  </span>
                )}
                {selectedTimePeriod !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50">
                    {currentTimePeriod?.label}
                    <X
                      className="h-2.5 w-2.5 cursor-pointer hover:text-white"
                      onClick={() => handleTimePeriodSelect('all')}
                    />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
