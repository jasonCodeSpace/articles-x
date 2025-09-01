'use client'

import React from 'react'
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
      <DropdownMenuContent align="start" className="w-[200px] p-1 max-h-[300px] overflow-y-auto bg-background border-border">
        <div className="flex flex-col gap-0.5">
          {allCategories.map((category) => {
            const categoryValue = category === 'All' ? 'all' : category
            return (
              <DropdownMenuItem
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`cursor-pointer text-sm px-3 py-2 rounded-sm transition-colors ${
                  selectedCategory === categoryValue 
                    ? 'bg-accent text-accent-foreground font-medium' 
                    : 'hover:bg-accent/50'
                }`}
              >
                {category}
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}