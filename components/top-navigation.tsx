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
import { Search, User, ChevronDown } from 'lucide-react'

interface TopNavigationProps {
  onSearchChange: (search: string) => void
  onCategoryChange: (category: string) => void
  onTimeFilterChange: (filter: string) => void
  searchValue: string
  currentCategory: string
  currentTimeFilter: string
  categories?: string[]
}

export function TopNavigation({
  onSearchChange,
  onCategoryChange: _onCategoryChange,
  onTimeFilterChange: _onTimeFilterChange,
  searchValue,
  currentCategory: _currentCategory,
  currentTimeFilter: _currentTimeFilter,
  categories: _categories = ['All', 'Crypto', 'Infra']
}: TopNavigationProps) {
  const [searchInput, setSearchInput] = useState(searchValue)

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    const timeoutId = setTimeout(() => {
      onSearchChange(value)
    }, 500)
    return () => clearTimeout(timeoutId)
  }

  const _timeFilters = ['24h', '3d', '7d']

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black">
      {/* Left side - Logo */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white">Xarticle</h1>
      </div>



      {/* Right side - Subscribe and User */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        >
          Subscribe
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          className="border-gray-600 hover:bg-gray-800"
        >
          <User className="h-4 w-4 text-gray-400" />
        </Button>
      </div>
    </div>
  )
}

// Secondary navigation bar with filters
export function SecondaryNavigation({
  onCategoryChange,
  onTimeFilterChange,
  currentCategory,
  currentTimeFilter,
  categories = ['All', 'Crypto', 'Infra']
}: {
  onCategoryChange: (category: string) => void
  onTimeFilterChange: (filter: string) => void
  currentCategory: string
  currentTimeFilter: string
  categories?: string[]
}) {
  const timeFilters = ['24h', '3d', '7d']

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black/95">
      {/* Left side - Navigation tabs */}
      <div className="flex items-center gap-6">
        <Button 
          variant="ghost" 
          className="text-white hover:text-blue-400 font-medium"
        >
          Articles
        </Button>
        <Button 
          variant="ghost" 
          className="text-gray-400 hover:text-white"
        >
          Trending
        </Button>
      </div>

      {/* Center - Time filters */}
      <div className="flex items-center gap-2">
        {timeFilters.map((filter) => (
          <Button
            key={filter}
            variant={currentTimeFilter === filter ? "default" : "ghost"}
            size="sm"
            onClick={() => onTimeFilterChange(filter)}
            className={`
              ${currentTimeFilter === filter 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
              }
            `}
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Right side - Category Filter, Language and Sort */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-white gap-2"
            >
              {currentCategory}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {categories.map((category) => (
              <DropdownMenuItem 
                key={category}
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-gray-400 text-sm">Language: All</span>
        <span className="text-gray-400 text-sm">English</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-white gap-2"
            >
              Sort: Latest
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Latest</DropdownMenuItem>
            <DropdownMenuItem>Oldest</DropdownMenuItem>
            <DropdownMenuItem>Most Views</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Sidebar with topics and filters
export function Sidebar({
  onCategoryChange: _onCategoryChange,
  currentCategory: _currentCategory,
  categories: _categories = ['All', 'Crypto', 'Infra']
}: {
  onCategoryChange: (category: string) => void
  currentCategory: string
  categories?: string[]
}) {
  const topics = ['AI', 'Crypto', 'Product', 'Infra', 'Policy', 'Crypto']

  return (
    <div className="w-80 p-6 border-l border-gray-800 bg-black/95 space-y-6">

      {/* Topics */}
      <div>
        <h3 className="text-white font-semibold mb-4">Topics</h3>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {topic}
            </Button>
          ))}
        </div>
      </div>



      {/* Subscribe to daily brief */}
      <div className="pt-4 border-t border-gray-800">
        <p className="text-gray-400 text-sm mb-2">Subscribe to daily brief</p>
      </div>
    </div>
  )
}