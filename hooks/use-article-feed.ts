'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Article } from '@/components/article-card'
import { SortOption } from '@/lib/articles'
import { calculatePagination } from '@/components/pagination'

interface UseArticleFeedProps {
  initialArticles: Article[]
  initialCategories: string[]
  initialCategory?: string
  initialSearchQuery?: string
  itemsPerPage?: number
}

interface UseArticleFeedReturn {
  articles: Article[]
  filteredArticles: Article[]
  paginatedArticles: Article[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  sortOption: SortOption
  selectedCategory: string
  categories: string[]
  currentPage: number
  totalPages: number
  totalItems: number
  handleSearch: (query: string) => void
  handleSort: (sort: SortOption) => void
  handleCategoryChange: (category: string) => void
  handlePageChange: (page: number) => void
  handleTimeSort: () => void
  handleViewsSort: () => void
  clearSearch: () => void
  retry: () => void
}

export function useArticleFeed({
  initialArticles,
  initialCategories,
  initialCategory = 'all',
  initialSearchQuery = '',
  itemsPerPage = 20
}: UseArticleFeedProps): UseArticleFeedReturn {
  // State
  const [articles] = useState<Article[]>(initialArticles)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [currentPage, setCurrentPage] = useState(1)
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
        article.author_name.toLowerCase().includes(query) ||
        article.author_handle?.toLowerCase().includes(query)
      )
    }

    // Apply category filter (single tag only)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => {
        if (!article.category) return false
        // Only match the first category for single tag support
        const firstCategory = article.category.split(',')[0].trim()
        return firstCategory === selectedCategory
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOption === 'views_high') {
        const aViews = a.tweet_views || 0
        const bViews = b.tweet_views || 0
        return bViews - aViews
      } else if (sortOption === 'views_low') {
        const aViews = a.tweet_views || 0
        const bViews = b.tweet_views || 0
        return aViews - bViews
      } else {
        const aDate = new Date(a.article_published_at || a.created_at)
        const bDate = new Date(b.article_published_at || b.created_at)

        if (sortOption === 'newest') {
          return bDate.getTime() - aDate.getTime()
        } else {
          return aDate.getTime() - bDate.getTime()
        }
      }
    })

    return filtered
  }, [articles, searchQuery, selectedCategory, sortOption])

  // Calculate pagination
  const paginationInfo = useMemo(() => {
    return calculatePagination(filteredArticles.length, itemsPerPage, currentPage)
  }, [filteredArticles.length, itemsPerPage, currentPage])

  // Get paginated articles
  const paginatedArticles = useMemo(() => {
    const { startIndex, endIndex } = paginationInfo
    return filteredArticles.slice(startIndex, endIndex)
  }, [filteredArticles, paginationInfo])

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
    setError(null)
  }, [])

  const handleSort = useCallback((sort: SortOption) => {
    setSortOption(sort)
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1) // Reset to first page when category changes
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('all')
    setCurrentPage(1) // Reset to first page when clearing search
    setError(null)
  }, [])

  const retry = useCallback(() => {
    setError(null)
    // In a real implementation, you might refetch data here
    // For now, we're using static data from server
  }, [])

  const handleTimeSort = useCallback(() => {
    if (sortOption === 'newest') {
      setSortOption('oldest')
    } else {
      setSortOption('newest')
    }
    setCurrentPage(1)
  }, [sortOption])

  const handleViewsSort = useCallback(() => {
    if (sortOption === 'views_high') {
      // Second click: reset to default (newest)
      setSortOption('newest')
    } else {
      // First click: sort by views high to low
      setSortOption('views_high')
    }
    setCurrentPage(1)
  }, [sortOption])

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
    paginatedArticles,
    isLoading,
    error,
    searchQuery,
    sortOption,
    selectedCategory,
    categories: initialCategories,
    currentPage,
    totalPages: paginationInfo.totalPages,
    totalItems: filteredArticles.length,
    handleSearch,
    handleSort,
    handleCategoryChange,
    handlePageChange,
    handleTimeSort,
    handleViewsSort,
    clearSearch,
    retry,
  }
}