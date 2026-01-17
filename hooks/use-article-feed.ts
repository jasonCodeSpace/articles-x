'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Article } from '@/components/article-card'
import { SortOption } from '@/lib/articles'
import { calculatePagination } from '@/components/pagination'

export type TimePeriod = 'all' | 'today' | 'week' | 'month' | '3months'
export type DisplayLanguage = 'en' | 'cn'

interface UseArticleFeedProps {
  initialArticles: Article[]
  initialSearchQuery?: string
  initialCategory?: string
  initialTimePeriod?: TimePeriod
  initialLanguage?: DisplayLanguage
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
  selectedTimePeriod: TimePeriod
  displayLanguage: DisplayLanguage
  currentPage: number
  totalPages: number
  totalItems: number
  handleSearch: (query: string) => void
  handleSort: (sort: SortOption) => void
  handleCategoryChange: (category: string) => void
  handleTimePeriodChange: (period: TimePeriod) => void
  handleLanguageChange: (language: DisplayLanguage) => void
  handlePageChange: (page: number) => void
  handleTimeSort: () => void
  handleViewsSort: () => void
  clearSearch: () => void
  clearFilters: () => void
  retry: () => void
}

// Helper function to get date threshold for time period
function getDateThreshold(period: TimePeriod): Date | null {
  if (period === 'all') return null

  const now = new Date()
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '3months':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    default:
      return null
  }
}

export function useArticleFeed({
  initialArticles,
  initialSearchQuery = '',
  initialCategory = 'All',
  initialTimePeriod = 'all',
  initialLanguage = 'en',
  itemsPerPage = 15
}: UseArticleFeedProps): UseArticleFeedReturn {
  const searchParams = useSearchParams()

  // State
  const [articles] = useState<Article[]>(initialArticles)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>(initialTimePeriod)
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>(initialLanguage)
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Monitor URL parameter changes and reload page if filter changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const currentFilter = searchParams.get('filter')
    const urlFilter = new URLSearchParams(window.location.search).get('filter')
    if (urlFilter !== currentFilter) {
      window.location.reload()
    }
  }, [searchParams])

  // Filter and sort articles client-side (category and time filtering happen BEFORE pagination)
  const filteredArticles = useMemo(() => {
    let filtered = [...articles]

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(article => {
        if (!article.category) return false
        const categories = article.category.split(',').map(cat => cat.trim().toLowerCase())
        return categories.includes(selectedCategory.toLowerCase())
      })
    }

    // Apply time period filter
    const dateThreshold = getDateThreshold(selectedTimePeriod)
    if (dateThreshold) {
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.article_published_at || article.created_at)
        return articleDate >= dateThreshold
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.title_english?.toLowerCase().includes(query) ||
        article.author_name.toLowerCase().includes(query) ||
        article.author_handle?.toLowerCase().includes(query)
      )
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
  }, [articles, selectedCategory, selectedTimePeriod, searchQuery, sortOption])

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
    setCurrentPage(1)
    setError(null)
  }, [])

  const handleSort = useCallback((sort: SortOption) => {
    setSortOption(sort)
    setCurrentPage(1)
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    setError(null)
  }, [])

  const handleTimePeriodChange = useCallback((period: TimePeriod) => {
    setSelectedTimePeriod(period)
    setCurrentPage(1)
    setError(null)
  }, [])

  const handleLanguageChange = useCallback((language: DisplayLanguage) => {
    setDisplayLanguage(language)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setCurrentPage(1)
    setError(null)
  }, [])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('All')
    setSelectedTimePeriod('all')
    setCurrentPage(1)
    setError(null)
  }, [])

  const retry = useCallback(() => {
    setError(null)
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
      setSortOption('newest')
    } else {
      setSortOption('views_high')
    }
    setCurrentPage(1)
  }, [sortOption])

  // Set error if no results found
  useEffect(() => {
    if ((searchQuery.trim() || selectedCategory !== 'All' || selectedTimePeriod !== 'all') &&
        filteredArticles.length === 0 && articles.length > 0) {
      setError('no-results')
    } else {
      setError(null)
    }
  }, [searchQuery, selectedCategory, selectedTimePeriod, filteredArticles.length, articles.length])

  return {
    articles,
    filteredArticles,
    paginatedArticles,
    isLoading,
    error,
    searchQuery,
    sortOption,
    selectedCategory,
    selectedTimePeriod,
    displayLanguage,
    currentPage,
    totalPages: paginationInfo.totalPages,
    totalItems: filteredArticles.length,
    handleSearch,
    handleSort,
    handleCategoryChange,
    handleTimePeriodChange,
    handleLanguageChange,
    handlePageChange,
    handleTimeSort,
    handleViewsSort,
    clearSearch,
    clearFilters,
    retry,
  }
}
