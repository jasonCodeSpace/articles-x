'use client'

import { Folder } from 'lucide-react'
import { useState } from 'react'

// Main categories only - simplified for performance
const MAIN_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'ai', name: 'AI' },
  { id: 'crypto', name: 'Crypto' },
  { id: 'tech', name: 'Tech' },
  { id: 'business', name: 'Business' },
  { id: 'startup', name: 'Startups' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'health', name: 'Health' },
]

interface SimpleCategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function SimpleCategoryFilter({ selectedCategory, onCategoryChange }: SimpleCategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedCat = MAIN_CATEGORIES.find(c => c.id === selectedCategory)
  const displayName = selectedCat?.name || 'Category'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-4 h-10"
      >
        <Folder className="h-3.5 w-3.5" />
        <span className="text-[11px] uppercase tracking-wider font-bold">{displayName}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-20 bg-[#0A0A0A] border border-white/10 rounded-xl p-2 min-w-[150px] shadow-xl">
            {MAIN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onCategoryChange(cat.id)
                  setIsOpen(false)
                }}
                className={`block w-full text-left px-3 py-2 rounded-lg text-[11px] uppercase tracking-wider transition-colors ${
                  selectedCategory === cat.id
                    ? 'text-white bg-white/10'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
