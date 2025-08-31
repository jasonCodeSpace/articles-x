'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Search, Filter, SortAsc, SortDesc, ChevronDown } from 'lucide-react'
import { SortOption } from '@/lib/articles'

interface FeedToolbarProps {
  onSearchChange: (search: string) => void
  onSortChange: (sort: SortOption) => void
  onCategoryChange: (category: string) => void
  currentSort: SortOption
  currentCategory: string
  searchValue: string
  categories?: string[]
  isLoading?: boolean
}

export function FeedToolbar({
  onSearchChange,
  onSortChange,
  onCategoryChange,
  currentSort,
  currentCategory,
  searchValue,
  categories = [],
  isLoading = false
}: FeedToolbarProps) {
  const [searchInput, setSearchInput] = useState(searchValue)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(searchInput)
  }

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    // Debounced search - trigger after user stops typing
    const timeoutId = setTimeout(() => {
      onSearchChange(value)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const sortOptions = [
    { value: 'newest' as const, label: 'Newest First', icon: SortDesc },
    { value: 'oldest' as const, label: 'Oldest First', icon: SortAsc },
  ]

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ]

  const currentSortOption = sortOptions.find(opt => opt.value === currentSort)
  const currentCategoryOption = categoryOptions.find(opt => opt.value === currentCategory) || categoryOptions[0]

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-center p-3 bg-transparent border-b border-gray-700/50 -mt-22 sm:-mt-14">
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
            className="pl-10 pr-4 bg-gray-900/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-400 text-center rounded-full"
            disabled={isLoading}
          />
        </div>
      </form>

      {/* Right side - Filters and Sort */}
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        {/* Category Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2 rounded-full w-full sm:w-auto text-sm"
              disabled={isLoading}
            >
              <Filter className="h-4 w-4" />
              <span className="truncate">{currentCategoryOption.label}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto p-1 bg-gray-900 border-gray-700 rounded-xl">
            <div className="flex flex-col gap-0.5">
              {categoryOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onCategoryChange(option.value)}
                  className={`cursor-pointer text-sm px-3 py-2 rounded-lg transition-colors ${
                    currentCategory === option.value ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
                  }`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2 rounded-full w-full sm:w-auto text-sm"
              disabled={isLoading}
            >
              {currentSortOption && <currentSortOption.icon className="h-4 w-4" />}
              <span className="truncate">{currentSortOption?.label}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-gray-900 border-gray-700 rounded-xl">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={`rounded-lg ${currentSort === option.value ? 'bg-accent' : ''}`}
              >
                <option.icon className="h-4 w-4 mr-2" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}