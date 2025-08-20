'use client'

import { ArticleCard, Article } from '@/components/article-card'
import { FeedEmptyState } from '@/components/feed-empty-state'
import { FeedLoading } from '@/components/feed-loading'
import { Pagination } from '@/components/pagination'
import { useArticleFeed } from '@/hooks/use-article-feed'

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
    currentPage,
    totalPages,
    handlePageChange,
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