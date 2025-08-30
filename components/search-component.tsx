'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export function SearchComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    // Update URL with search parameter
    const params = new URLSearchParams(searchParams.toString())
    if (query.trim()) {
      params.set('search', query.trim())
    } else {
      params.delete('search')
    }
    
    // Reset page to 1 when searching
    params.delete('page')
    
    const newUrl = params.toString() ? `/articles?${params.toString()}` : '/articles'
    router.push(newUrl)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Debounced search - search as user types with a delay
    const timeoutId = setTimeout(() => {
      handleSearch(value)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }

  return (
    <div className="px-4 py-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search articles, authors..."
          value={searchQuery}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-4 bg-gray-900/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-400"
        />
      </div>
    </div>
  )
}