'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface CategoryDropdownProps {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryDropdown({ categories, selectedCategory, onCategoryChange }: CategoryDropdownProps) {
  const allCategories = ['All', ...categories]
  
  const getDisplayName = (category: string) => {
    return category === 'all' ? 'All' : category
  }
  
  const handleCategorySelect = (category: string) => {
    const categoryValue = category === 'All' ? 'all' : category
    onCategoryChange(categoryValue)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-[140px] justify-between text-sm font-medium"
        >
          {getDisplayName(selectedCategory)}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[140px]">
        {allCategories.map((category) => {
          const categoryValue = category === 'All' ? 'all' : category
          return (
            <DropdownMenuItem
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`cursor-pointer ${
                selectedCategory === categoryValue 
                  ? 'bg-accent text-accent-foreground' 
                  : ''
              }`}
            >
              {category}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}