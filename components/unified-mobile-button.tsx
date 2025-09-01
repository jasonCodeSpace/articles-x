'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Filter, Globe, Languages, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface UnifiedMobileButtonProps {
  onCategoryChange: (category: string) => void
  onLanguageChange: (language: string) => void
  currentCategory: string
  currentLanguage: string
  _categories?: string[]
  isLoading?: boolean
  language?: 'original' | 'en'
  setLanguage?: (lang: 'original' | 'en') => void
}

export function UnifiedMobileButton({
  onCategoryChange,
  onLanguageChange,
  currentCategory,
  currentLanguage,
  _categories = [],
  isLoading = false,
  language,
  setLanguage
}: UnifiedMobileButtonProps) {
  const { language: contextLanguage, setLanguage: contextSetLanguage } = useLanguage()

  
  // Use props if provided, otherwise fall back to context
  const currentLang = language || contextLanguage
  const setCurrentLang = setLanguage || contextSetLanguage

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
    { value: 'TECHNOLOGY', label: 'Technology' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'POLITICS', label: 'Politics' },
    { value: 'CRYPTO', label: 'Crypto & Blockchain' },
    { value: 'ENTERTAINMENT', label: 'Entertainment' },
    { value: 'AI', label: 'AI & Machine Learning' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'HISTORY', label: 'History' },
    { value: 'POLITICS & SOCIETY', label: 'Politics & Society' }
  ]

  const _currentLanguageOption = languageOptions.find(opt => opt.value === currentLanguage) || languageOptions[0]
  const _currentCategoryOption = categoryOptions.find(opt => opt.value === currentCategory) || categoryOptions[0]

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category)
  }

  const handleLanguageFilterSelect = (lang: string) => {
    onLanguageChange(lang)
  }

  const handleLanguageToggle = (lang: 'original' | 'en') => {
    setCurrentLang(lang)
  }

  const renderAllOptions = () => (
    <>
      {/* Display Language Section - Moved to top */}
      <DropdownMenuLabel className="font-semibold text-xs text-gray-400 px-3 py-2">Display Language</DropdownMenuLabel>
      
      <DropdownMenuItem
        onClick={() => handleLanguageToggle('original')}
        className={`cursor-pointer px-3 py-2 rounded-lg flex items-center gap-2 ${
          currentLang === 'original' ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
        }`}
      >
        <Languages className="h-4 w-4" />
        <span>Original</span>
      </DropdownMenuItem>
      
      <DropdownMenuItem
        onClick={() => handleLanguageToggle('en')}
        className={`cursor-pointer px-3 py-2 rounded-lg flex items-center gap-2 ${
          currentLang === 'en' ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
        }`}
      >
        <Languages className="h-4 w-4" />
        <span>English</span>
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className="my-2" />
      
      {/* Categories Section */}
      <DropdownMenuLabel className="font-semibold text-xs text-gray-400 px-3 py-2">Categories</DropdownMenuLabel>
      {categoryOptions.map((option) => (
        <DropdownMenuItem
          key={option.value}
          onClick={() => handleCategorySelect(option.value)}
          className={`cursor-pointer text-sm px-3 py-2 rounded-lg transition-colors ${
            currentCategory === option.value ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
          }`}
        >
          <Filter className="h-4 w-4 mr-2" />
          {option.label}
        </DropdownMenuItem>
      ))}
      
      <DropdownMenuSeparator className="my-2" />
      
      {/* Language Filter Section */}
      <DropdownMenuLabel className="font-semibold text-xs text-gray-400 px-3 py-2">Language Filter</DropdownMenuLabel>
      {languageOptions.map((option) => (
        <DropdownMenuItem
          key={option.value}
          onClick={() => handleLanguageFilterSelect(option.value)}
          className={`cursor-pointer px-3 py-2 rounded-lg ${
            currentLanguage === option.value ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
          }`}
        >
          <Globe className="h-4 w-4 mr-2" />
          {option.label}
        </DropdownMenuItem>
      ))}
    </>
  )





  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 rounded-full w-full text-sm"
          disabled={isLoading}
        >
          <Filter className="h-4 w-4" />
          <span className="truncate">Filters</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 max-h-[400px] overflow-y-auto p-1 bg-background border-border rounded-xl"
      >
        <div className="flex flex-col gap-0.5">
          {renderAllOptions()}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}