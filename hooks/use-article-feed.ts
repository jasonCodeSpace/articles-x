'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Article } from '@/components/article-card'
import { SortOption } from '@/lib/articles'

interface UseArticleFeedProps {
  initialArticles: Article[]
  initialCategories: string[]
}

interface UseArticleFeedReturn {
  articles: Article[]
  filteredArticles: Article[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  sortOption: SortOption
  selectedCategory: string
  categories: string[]
  handleSearch: (query: string) => void
  handleSort: (sort: SortOption) => void
  handleCategoryChange: (category: string) => void
  clearSearch: () => void
  retry: () => void
}

export function useArticleFeed({
  initialArticles,
  initialCategories
}: UseArticleFeedProps): UseArticleFeedReturn {
  // State
  const [articles] = useState<Article[]>(initialArticles)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter and sort articles client-side
  const filteredArticles = useMemo(() => {
    let filtered = [...articles]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt?.toLowerCase().includes(query) ||
        article.author_name.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aDate = new Date(a.published_at || a.created_at)
      const bDate = new Date(b.published_at || b.created_at)

      if (sortOption === 'newest') {
        return bDate.getTime() - aDate.getTime()
      } else {
        return aDate.getTime() - bDate.getTime()
      }
    })

    return filtered
  }, [articles, searchQuery, selectedCategory, sortOption])

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setError(null)
  }, [])

  const handleSort = useCallback((sort: SortOption) => {
    setSortOption(sort)
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('all')
    setError(null)
  }, [])

  const retry = useCallback(() => {
    setError(null)
    // In a real implementation, you might refetch data here
    // For now, we're using static data from server
  }, [])

  // Set error if no results found with search
  useEffect(() => {
    if (searchQuery.trim() && filteredArticles.length === 0 && articles.length > 0) {
      setError('no-results')
    } else {
      setError(null)
    }
  }, [searchQuery, filteredArticles.length, articles.length])

  return {
    articles,
    filteredArticles,
    isLoading,
    error,
    searchQuery,
    sortOption,
    selectedCategory,
    categories: initialCategories,
    handleSearch,
    handleSort,
    handleCategoryChange,
    clearSearch,
    retry
  }
}