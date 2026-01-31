'use client'

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Article } from '@/components/article-card'
import { SortOption } from '@/lib/articles'
import { calculatePagination } from '@/components/pagination'
import type { TimePeriod, DisplayLanguage } from '@/components/feed'

// Re-export types for backward compatibility
export type { TimePeriod, DisplayLanguage } from '@/components/feed'

interface UseArticleFeedProps {
  initialArticles: Article[]
  initialSearchQuery?: string
  initialTimePeriod?: TimePeriod
  initialLanguage?: DisplayLanguage
  initialCategory?: string
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
  selectedTimePeriod: TimePeriod
  selectedCategory: string
  displayLanguage: DisplayLanguage
  currentPage: number
  totalPages: number
  totalItems: number
  handleSearch: (query: string) => void
  handleSort: (sort: SortOption) => void
  handleTimePeriodChange: (period: TimePeriod) => void
  handleCategoryChange: (category: string) => void
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
  initialTimePeriod = 'all',
  initialLanguage = 'en',
  initialCategory = 'all',
  itemsPerPage = 15
}: UseArticleFeedProps): UseArticleFeedReturn {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [articles] = useState<Article[]>(initialArticles)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>(initialTimePeriod)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>(initialLanguage)
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync URL with search query - non-blocking, no page reload
  useEffect(() => {
    if (typeof window === 'undefined') return

    const urlFilter = searchParams.get('search')
    if (urlFilter && urlFilter !== searchQuery) {
      setSearchQuery(urlFilter)
    }
  }, [searchParams])

  // Update URL when search changes - non-blocking
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    if (searchQuery) {
      params.set('search', searchQuery)
    } else {
      params.delete('search')
    }

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    router.replace(newUrl, { scroll: false })
  }, [searchQuery, router])

  // Filter and sort articles client-side (time filtering happens BEFORE pagination)
  const filteredArticles = useMemo(() => {
    let filtered = [...articles]

    // Apply time period filter
    const dateThreshold = getDateThreshold(selectedTimePeriod)
    if (dateThreshold) {
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.article_published_at || article.created_at)
        return articleDate >= dateThreshold
      })
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => {
        const articleCategory = article.category || article.main_category
        // If category contains ':', it's a specific subcategory (e.g., 'tech:ai')
        if (selectedCategory.includes(':')) {
          return article.category === selectedCategory
        }
        // Otherwise filter by main_category (e.g., 'tech' matches all 'tech:*' articles)
        return article.main_category === selectedCategory
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.title_english?.toLowerCase().includes(query) ||
        article.full_article_content?.toLowerCase().includes(query) ||
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
  }, [articles, selectedTimePeriod, searchQuery, sortOption])

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
    startTransition(() => {
      setSearchQuery(query)
      setCurrentPage(1)
      setError(null)
    })
  }, [])

  const handleSort = useCallback((sort: SortOption) => {
    startTransition(() => {
      setSortOption(sort)
      setCurrentPage(1)
    })
  }, [])

  const handleTimePeriodChange = useCallback((period: TimePeriod) => {
    startTransition(() => {
      setSelectedTimePeriod(period)
      setCurrentPage(1)
      setError(null)
    })
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    startTransition(() => {
      setSelectedCategory(category)
      setCurrentPage(1)
      setError(null)
    })
  }, [])

  const handleLanguageChange = useCallback((language: DisplayLanguage) => {
    setDisplayLanguage(language)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const clearSearch = useCallback(() => {
    startTransition(() => {
      setSearchQuery('')
      setCurrentPage(1)
      setError(null)
    })
  }, [])

  const clearFilters = useCallback(() => {
    startTransition(() => {
      setSearchQuery('')
      setSelectedTimePeriod('all')
      setSelectedCategory('all')
      setCurrentPage(1)
      setError(null)
    })
  }, [])

  const retry = useCallback(() => {
    setError(null)
  }, [])

  const handleTimeSort = useCallback(() => {
    startTransition(() => {
      if (sortOption === 'newest') {
        setSortOption('oldest')
      } else {
        setSortOption('newest')
      }
      setCurrentPage(1)
    })
  }, [sortOption])

  const handleViewsSort = useCallback(() => {
    startTransition(() => {
      if (sortOption === 'views_high') {
        setSortOption('newest')
      } else {
        setSortOption('views_high')
      }
      setCurrentPage(1)
    })
  }, [sortOption])

  // Set error if no results found
  useEffect(() => {
    if ((searchQuery.trim() || selectedTimePeriod !== 'all') &&
        filteredArticles.length === 0 && articles.length > 0) {
      setError('no-results')
    } else {
      setError(null)
    }
  }, [searchQuery, selectedTimePeriod, filteredArticles.length, articles.length])

  return {
    articles,
    filteredArticles,
    paginatedArticles,
    isLoading,
    error,
    searchQuery,
    sortOption,
    selectedTimePeriod,
    selectedCategory,
    displayLanguage,
    currentPage,
    totalPages: paginationInfo.totalPages,
    totalItems: filteredArticles.length,
    handleSearch,
    handleSort,
    handleTimePeriodChange,
    handleCategoryChange,
    handleLanguageChange,
    handlePageChange,
    handleTimeSort,
    handleViewsSort,
    clearSearch,
    clearFilters,
    retry,
  }
}
