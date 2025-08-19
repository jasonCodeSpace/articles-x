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
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-white border-b border-gray-200">
      {/* Left side - Search */}
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
            className="pl-10 pr-4"
            disabled={isLoading}
          />
        </div>
      </form>

      {/* Right side - Filters and Sort */}
      <div className="flex items-center gap-2">
        {/* Category Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2"
              disabled={isLoading}
            >
              <Filter className="h-4 w-4" />
              {currentCategoryOption.label}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {categoryOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onCategoryChange(option.value)}
                className={currentCategory === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2"
              disabled={isLoading}
            >
              {currentSortOption && <currentSortOption.icon className="h-4 w-4" />}
              {currentSortOption?.label}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={currentSort === option.value ? 'bg-accent' : ''}
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