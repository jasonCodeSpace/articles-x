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
}

export function ArticleFeed({ initialArticles, initialCategories }: ArticleFeedProps) {
  const {
    paginatedArticles,
    isLoading,
    error,
    searchQuery,
    sortOption,
    currentPage,
    totalPages,
    handlePageChange,
    handleTimeSort,
    handleViewsSort,
    clearSearch,
    retry
  } = useArticleFeed({
    initialArticles,
    initialCategories
  })

  if (isLoading) {
    return <FeedLoading />
  }

  return (
    <div>
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
          {/* Sort buttons */}
          <div className="flex gap-3 mb-6 pb-4 border-b border-gray-800">
            <Button
              variant={sortOption === 'newest' || sortOption === 'oldest' ? 'default' : 'outline'}
              size="sm"
              onClick={handleTimeSort}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {sortOption === 'oldest' ? '最老文章' : '最新文章'}
            </Button>
            
            <Button
              variant={sortOption === 'views_high' ? 'default' : 'outline'}
              size="sm"
              onClick={handleViewsSort}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {sortOption === 'views_high' ? '观看量排序' : '按观看量排序'}
            </Button>
          </div>
          
          <div className="divide-y divide-gray-800">
            {paginatedArticles.map((article: Article) => (
              <ArticleCard
                key={article.id}
                article={article}
                className="border-0 rounded-none bg-transparent hover:bg-gray-950/50 transition-colors"
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