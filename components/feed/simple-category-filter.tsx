'use client'

import { Folder, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import * as DropdownMenu from '@/components/ui/dropdown-menu'
import { CATEGORIES } from '@/lib/categories'

interface SimpleCategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function SimpleCategoryFilter({ selectedCategory, onCategoryChange }: SimpleCategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Find selected category info
  const selectedSub = CATEGORIES.flatMap(cat =>
    cat.subcategories.map(sub => ({ ...sub, mainCategoryId: cat.id }))
  ).find(c => c.id === selectedCategory)

  const selectedMain = selectedSub ? CATEGORIES.find(c => c.id === selectedSub?.mainCategoryId) : null
  const selectedMainDirect = CATEGORIES.find(c => c.id === selectedCategory)

  const displayName = selectedSub
    ? `${selectedMain?.name} / ${selectedSub.name}`
    : selectedMainDirect?.name || 'Category'

  const hasSelection = selectedCategory !== 'all'

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCategoryChange('all')
  }

  return (
    <DropdownMenu.DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-4 h-10">
          <Folder className="h-3.5 w-3.5" />
          <span className="text-[11px] uppercase tracking-wider font-bold">{displayName}</span>
          {hasSelection ? (
            <X className="h-3 w-3 opacity-50 hover:opacity-100" onClick={handleClear} />
          ) : (
            <ChevronDown className="h-3 w-3 opacity-50" />
          )}
        </button>
      </DropdownMenu.DropdownMenuTrigger>

      <DropdownMenu.DropdownMenuContent
        align="start"
        className="min-w-[220px] max-h-[400px] overflow-y-auto border border-white/10 rounded-2xl p-2"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        {/* All Categories */}
        <DropdownMenu.DropdownMenuItem
          onClick={() => { onCategoryChange('all'); setIsOpen(false); }}
          className="rounded-lg text-[11px] uppercase tracking-wider cursor-pointer transition-colors text-white/50 hover:text-white hover:bg-white/5"
        >
          All Categories
        </DropdownMenu.DropdownMenuItem>

        {/* Category Groups with Submenus */}
        {CATEGORIES.map((category) => (
          <DropdownMenu.DropdownMenuSub key={category.id}>
            <DropdownMenu.DropdownMenuSubTrigger className="rounded-lg text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors text-white/70 hover:text-white hover:bg-white/5">
              {category.name}
            </DropdownMenu.DropdownMenuSubTrigger>

            <DropdownMenu.DropdownMenuSubContent
              className="min-w-[180px] border border-white/10 rounded-xl p-1"
              style={{ backgroundColor: '#0A0A0A' }}
            >
              {/* Main category option */}
              <DropdownMenu.DropdownMenuItem
                onClick={() => { onCategoryChange(category.id); setIsOpen(false); }}
                className="rounded-lg text-[11px] cursor-pointer transition-colors text-white/50 hover:text-white hover:bg-white/5"
              >
                All {category.name}
              </DropdownMenu.DropdownMenuItem>

              <DropdownMenu.DropdownMenuSeparator className="my-1 bg-white/10" />

              {/* Subcategories */}
              {category.subcategories.map((sub) => (
                <DropdownMenu.DropdownMenuItem
                  key={sub.id}
                  onClick={() => { onCategoryChange(sub.id); setIsOpen(false); }}
                  className="rounded-lg text-[11px] cursor-pointer transition-colors text-white/50 hover:text-white hover:bg-white/5"
                >
                  {sub.name}
                </DropdownMenu.DropdownMenuItem>
              ))}
            </DropdownMenu.DropdownMenuSubContent>
          </DropdownMenu.DropdownMenuSub>
        ))}
      </DropdownMenu.DropdownMenuContent>
    </DropdownMenu.DropdownMenu>
  )
}
