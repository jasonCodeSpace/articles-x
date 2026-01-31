'use client'

import { Folder, ChevronDown, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORIES, type Category } from '@/lib/categories'
import * as DropdownMenu from '@/components/ui/dropdown-menu'

interface TwoLevelCategoryDropdownProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
  onClear?: () => void
}

export function TwoLevelCategoryDropdown({
  selectedCategory,
  onCategoryChange,
  onClear
}: TwoLevelCategoryDropdownProps) {
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

  // Clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClear?.()
  }

  return (
    <DropdownMenu.DropdownMenu>
      <DropdownMenu.DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-3 sm:px-4 h-10",
            "data-[state=open]:bg-white/5 data-[state=open]:text-white"
          )}
        >
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold">
            {displayName}
          </span>
          {hasSelection && onClear ? (
            <X
              className="h-3 w-3 opacity-50 hover:opacity-100 shrink-0"
              onClick={handleClear}
            />
          ) : (
            <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
          )}
        </button>
      </DropdownMenu.DropdownMenuTrigger>

      <DropdownMenu.DropdownMenuContent
        align="start"
        className="min-w-[220px] max-h-[400px] overflow-y-auto border border-white/10 rounded-2xl p-2"
        style={{ backgroundColor: '#0A0A0A', opacity: 1 }}
      >
        {/* Option: All Categories */}
        <DropdownMenu.DropdownMenuItem
          onClick={() => onCategoryChange('all')}
          className={cn(
            "rounded-lg text-[11px] uppercase tracking-wider cursor-pointer transition-colors",
            selectedCategory === 'all'
              ? 'text-white bg-white/10'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          )}
        >
          All Categories
        </DropdownMenu.DropdownMenuItem>

        {/* Category Groups with Submenus */}
        {CATEGORIES.map((category) => (
          <DropdownMenu.DropdownMenuSub key={category.id}>
            <DropdownMenu.DropdownMenuSubTrigger
              className={cn(
                "rounded-lg text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors",
                selectedCategory === category.id
                  ? 'text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              )}
            >
              {category.name}
            </DropdownMenu.DropdownMenuSubTrigger>

            <DropdownMenu.DropdownMenuSubContent
              className="min-w-[180px] border border-white/10 rounded-xl p-1"
              style={{ backgroundColor: '#0A0A0A', opacity: 1 }}
            >
              {/* Main category option */}
              <DropdownMenu.DropdownMenuItem
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "rounded-lg text-[11px] cursor-pointer transition-colors",
                  selectedCategory === category.id
                    ? 'text-white bg-white/10'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                All {category.name}
              </DropdownMenu.DropdownMenuItem>

              <DropdownMenu.DropdownMenuSeparator className="my-1 bg-white/10" />

              {/* Subcategories */}
              {category.subcategories.map((sub) => (
                <DropdownMenu.DropdownMenuItem
                  key={sub.id}
                  onClick={() => onCategoryChange(sub.id)}
                  className={cn(
                    "rounded-lg text-[11px] cursor-pointer transition-colors flex items-center gap-1",
                    selectedCategory === sub.id
                      ? 'text-white bg-white/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  )}
                >
                  <ChevronRight className="h-2.5 w-2.5 opacity-50" />
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
