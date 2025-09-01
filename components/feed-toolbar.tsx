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
import { Search, Filter, Globe, ChevronDown, Languages } from 'lucide-react'
import { UnifiedMobileButton } from '@/components/unified-mobile-button'

import { useLanguage } from '@/contexts/language-context'

interface FeedToolbarProps {
  onSearchChange: (search: string) => void
  onCategoryChange: (category: string) => void
  onLanguageChange: (language: string) => void
  currentCategory: string
  currentLanguage: string
  searchValue: string
  categories?: string[]
  isLoading?: boolean
}

export function FeedToolbar({
  onSearchChange,
  onCategoryChange,
  onLanguageChange,
  currentCategory,
  currentLanguage,
  searchValue,
  categories = [],
  isLoading = false
}: FeedToolbarProps) {
  const [searchInput, setSearchInput] = useState(searchValue)
  const { language, setLanguage } = useLanguage()

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

  const languageOptions = [
    { value: 'all', label: 'All Languages' },
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'ja', label: '日本語' },
  ]

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ]

  const currentLanguageOption = languageOptions.find(opt => opt.value === currentLanguage) || languageOptions[0]
  const currentCategoryOption = categoryOptions.find(opt => opt.value === currentCategory) || categoryOptions[0]

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-center p-3 bg-transparent border-b border-gray-700/50">
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

      {/* Right side - Filters and Sort */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Mobile: Unified Button */}
        <div className="sm:hidden w-full">
          <UnifiedMobileButton
            onCategoryChange={onCategoryChange}
            onLanguageChange={onLanguageChange}
            currentCategory={currentCategory}
            currentLanguage={currentLanguage}
            categories={categories}
            isLoading={isLoading}
          />
        </div>

        {/* Desktop: Separate Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 rounded-full text-sm"
                disabled={isLoading}
              >
                <Filter className="h-4 w-4" />
                <span className="truncate">{currentCategoryOption.label}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto p-1 bg-white dark:bg-gray-900 border-border rounded-xl backdrop-blur-none shadow-lg">
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

          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 rounded-full text-sm"
                disabled={isLoading}
              >
                <Languages className="h-4 w-4" />
                <span className="truncate">{language === 'en' ? 'English' : 'Original'}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-white dark:bg-gray-900 border-border rounded-xl backdrop-blur-none shadow-lg">
              <DropdownMenuItem
                onClick={() => setLanguage('original')}
                className={`rounded-lg cursor-pointer ${language === 'original' ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'}`}
              >
                Original
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className={`rounded-lg cursor-pointer ${language === 'en' ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'}`}
              >
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 rounded-full text-sm"
                disabled={isLoading}
              >
                <Globe className="h-4 w-4" />
                <span className="truncate">{currentLanguageOption.label}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-900 border-border rounded-xl backdrop-blur-none shadow-lg">
              {languageOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onLanguageChange(option.value)}
                  className={`rounded-lg ${currentLanguage === option.value ? 'bg-accent' : ''}`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}