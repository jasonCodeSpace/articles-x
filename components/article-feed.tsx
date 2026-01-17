'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useMemo } from 'react'
import { ArticleCard, Article } from '@/components/article-card'
import { FeedEmptyState } from '@/components/feed-empty-state'
import { useArticleFeed } from '@/hooks/use-article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { StaggerContainer } from '@/components/motion-wrapper'

// Dynamic import for non-critical components
const FeedToolbar = dynamic(() => import('@/components/feed-toolbar').then(mod => ({ default: mod.FeedToolbar })), {
  ssr: false,
  loading: () => <div className="h-16 bg-white/5 rounded-2xl animate-pulse" />
})

const Pagination = dynamic(() => import('@/components/pagination').then(mod => ({ default: mod.Pagination })), {
  ssr: false,
  loading: () => <div className="h-12 bg-white/5 rounded-full animate-pulse mx-auto max-w-xs" />
})

interface ArticleFeedProps {
  initialArticles: Article[]
  initialSearchQuery?: string
  initialCategory?: string
}

export function ArticleFeed({ initialArticles, initialSearchQuery = '', initialCategory = 'All' }: ArticleFeedProps) {
  const [sortBy, setSortBy] = useState<'latest' | 'hot'>('latest')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const sortOption = sortBy === 'hot' ? 'views_high' : 'newest'

  const {
    paginatedArticles: unfilteredArticles,
    isLoading: feedLoading,
    error,
    searchQuery,
    currentPage,
    totalPages,
    handleSearch,
    handleSort,
    handlePageChange,
    clearSearch,
    retry,
  } = useArticleFeed({ initialArticles, initialSearchQuery, itemsPerPage: 12 })

  // Filter articles by category client-side
  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'All') {
      return unfilteredArticles
    }
    return unfilteredArticles.filter((article: Article) => {
      if (!article.category) return false
      const categories = article.category.split(',').map(cat => cat.trim().toLowerCase())
      return categories.includes(selectedCategory.toLowerCase())
    })
  }, [unfilteredArticles, selectedCategory])

  useEffect(() => {
    handleSort(sortOption)
  }, [sortOption, handleSort])

  // Update category from URL if provided
  useEffect(() => {
    if (initialCategory && initialCategory !== 'All') {
      setSelectedCategory(initialCategory)
    }
  }, [initialCategory])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    // Reset to first page when category changes
    handlePageChange(1)
  }

  if (feedLoading) {
    return <FeedLoading />
  }

  return (
    <div className="space-y-12">
      {/* Feed Toolbar */}
      <section className="transition-all duration-300">
        <FeedToolbar
          onSearchChange={handleSearch}
          searchValue={searchQuery}
          isLoading={feedLoading}
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </section>

      {error === 'no-results' || filteredArticles.length === 0 ? (
        <FeedEmptyState
          type="no-results"
          searchQuery={searchQuery || (selectedCategory !== 'All' ? selectedCategory : '')}
          onClearSearch={() => {
            clearSearch()
            setSelectedCategory('All')
          }}
        />
      ) : initialArticles.length === 0 ? (
        <FeedEmptyState type="no-articles" />
      ) : error === 'error' ? (
        <FeedEmptyState
          type="error"
          onRetry={retry}
        />
      ) : (
        <div className="space-y-20">
          <StaggerContainer staggerChildren={0.05} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article: Article, index: number) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
                priority={index < 6}
              />
            ))}
          </StaggerContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-10 border-t border-white/5">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mx-auto"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
