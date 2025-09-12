'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, memo } from 'react'
import { ArticleCard, Article } from '@/components/article-card'
import { FeedEmptyState } from '@/components/feed-empty-state'
import { useArticleFeed } from '@/hooks/use-article-feed'
import { useLanguage } from '@/contexts/language-context'
import { FeedLoading } from '@/components/feed-loading'
import { FeaturedCard } from '@/components/featured-card'

// Dynamic import for non-critical components with better loading states
const FeedToolbar = dynamic(() => import('@/components/feed-toolbar').then(mod => ({ default: mod.FeedToolbar })), {
  ssr: false,
  loading: () => <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />
})

const Pagination = dynamic(() => import('@/components/pagination').then(mod => ({ default: mod.Pagination })), {
  ssr: false,
  loading: () => <div className="h-12 bg-muted/50 rounded-lg animate-pulse" />
})

// Memoized components for better performance
const MemoizedArticleCard = memo(ArticleCard)
const MemoizedFeaturedCard = memo(FeaturedCard)


interface ArticleFeedProps {
  initialArticles: Article[]
  initialSearchQuery?: string
}

export function ArticleFeed({ initialArticles, initialSearchQuery = '' }: ArticleFeedProps) {
  const [sortBy, setSortBy] = useState<'latest' | 'hot'>('latest')
  const { language, setLanguage } = useLanguage()

  // Map our sortBy state to useArticleFeed's SortOption
  const sortOption = sortBy === 'hot' ? 'views_high' : 'newest'

  const {
    paginatedArticles,
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
  } = useArticleFeed({ initialArticles, initialSearchQuery, itemsPerPage: 14 })

  // Update useArticleFeed's sort when our sortBy changes
  useEffect(() => {
    handleSort(sortOption)
  }, [sortOption, handleSort])

  if (feedLoading) {
    return <FeedLoading />
  }

  return (
    <div className="space-y-4">
      {/* Feed Toolbar */}
      <FeedToolbar
          onSearchChange={handleSearch}
          searchValue={searchQuery}
          isLoading={feedLoading}
          sortBy={sortBy}
          onSortChange={setSortBy}
          language={language === 'en' ? 'english' : 'original'}
            onLanguageChange={(lang) => setLanguage(lang === 'english' ? 'en' : 'original')}
        />

      {/* X.com style feed - single column */}
      {error === 'no-results' ? (
        <FeedEmptyState
          type="no-results"
          searchQuery={searchQuery}
          onClearSearch={clearSearch}
        />
      ) : initialArticles.length === 0 ? (
        <FeedEmptyState type="no-articles" />
      ) : error === 'error' ? (
        <FeedEmptyState
          type="error"
          onRetry={retry}
        />
      ) : paginatedArticles.length === 0 ? (
        <FeedEmptyState
          type="no-results"
          onClearSearch={clearSearch}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Featured card at the first position */}
            <MemoizedFeaturedCard />
            {paginatedArticles.map((article: Article, index: number) => {
              // Use stable key for better performance
              const stableKey = `${article.id}-${article.updated_at || article.created_at}`
              return (
                <MemoizedArticleCard
                  key={stableKey}
                  article={article}
                  index={index}
                  priority={index < 6}
                />
              )
            })}
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="border-t border-gray-800"
          />
        </>
      )}
    </div>
  )
}