'use client'

import { Button } from '@/components/ui/button'
import { Folder, ChevronDown, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES, type Category } from '@/lib/categories'
import { cn } from '@/lib/utils'

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
  const [isOpen, setIsOpen] = useState(false)

  // Find selected category info
  const selectedSub = CATEGORIES.flatMap(cat =>
    cat.subcategories.map(sub => ({ ...sub, mainCategoryId: cat.id }))
  ).find(c => c.id === selectedCategory)

  const selectedMain = selectedSub ? CATEGORIES.find(c => c.id === selectedSub?.mainCategoryId) : null

  const hasSelection = selectedCategory !== 'all'

  // Clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClear?.()
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-3 sm:px-4 h-10",
          isOpen && "bg-white/5 text-white"
        )}
      >
        <Folder className="h-3.5 w-3.5 shrink-0" />
        <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold">
          {selectedSub ? `${selectedMain?.name} / ${selectedSub.name}` : 'Category'}
        </span>
        {hasSelection && onClear ? (
          <X
            className="h-3 w-3 opacity-50 hover:opacity-100 shrink-0"
            onClick={handleClear}
          />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 min-w-[200px] max-h-[400px] overflow-y-auto bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 shadow-2xl">
          {/* Option: All Categories */}
          <button
            onClick={() => {
              onCategoryChange('all')
              setIsOpen(false)
            }}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-[11px] uppercase tracking-wider cursor-pointer transition-colors",
              selectedCategory === 'all'
                ? 'text-white bg-white/10'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            )}
          >
            All Categories
          </button>

          {/* Category Groups */}
          {CATEGORIES.map((category) => (
            <div key={category.id} className="mt-1">
              {/* Main Category */}
              <button
                onClick={() => {
                  onCategoryChange(category.id)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors flex items-center gap-1",
                  selectedCategory === category.id
                    ? 'text-white bg-white/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                {category.name}
              </button>

              {/* Subcategories */}
              <div className="ml-4 space-y-0.5">
                {category.subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      onCategoryChange(sub.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1 rounded-lg text-[11px] cursor-pointer transition-colors flex items-center gap-1",
                      selectedCategory === sub.id
                        ? 'text-white bg-white/10'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <ChevronRight className="h-2.5 w-2.5 opacity-50" />
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
