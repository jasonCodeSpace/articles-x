'use client'

import { ArticleCard, Article } from '@/components/article-card'
import { FeedEmptyState } from '@/components/feed-empty-state'
import { FeedLoading } from '@/components/feed-loading'
import { Pagination } from '@/components/pagination'
import { useArticleFeed } from '@/hooks/use-article-feed'
import { Button } from '@/components/ui/button'
import { Clock, Eye } from 'lucide-react'

interface ArticleFeedProps {
  initialArticles: Article[]
  initialCategories: string[]
  initialCategory?: string
  initialSearchQuery?: string
}

export function ArticleFeed({ initialArticles, initialCategories, initialCategory = 'all', initialSearchQuery = '' }: ArticleFeedProps) {
  const {
    paginatedArticles,
    isLoading,
    error,
    searchQuery,
    sortOption,
    selectedCategory,
    currentPage,
    totalPages,
    handlePageChange,
    handleTimeSort,
    handleViewsSort,
    handleCategoryChange,
    clearSearch,
    retry
  } = useArticleFeed({
    initialArticles,
    initialCategories,
    initialCategory,
    initialSearchQuery
  })

  if (isLoading) {
    return <FeedLoading />
  }

  return (
    <div className="space-y-6">


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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {paginatedArticles.map((article: Article, index: number) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
              />
            ))}
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