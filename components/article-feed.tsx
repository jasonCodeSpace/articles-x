'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
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
}

export function ArticleFeed({ initialArticles, initialSearchQuery = '' }: ArticleFeedProps) {
  const [sortBy, setSortBy] = useState<'latest' | 'hot'>('latest')
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
  } = useArticleFeed({ initialArticles, initialSearchQuery, itemsPerPage: 12 })

  useEffect(() => {
    handleSort(sortOption)
  }, [sortOption, handleSort])

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
        />
      </section>

      {error === 'no-results' || paginatedArticles.length === 0 ? (
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
      ) : (
        <div className="space-y-20">
          <StaggerContainer staggerChildren={0.05} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedArticles.map((article: Article, index: number) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
                priority={index < 6}
              />
            ))}
          </StaggerContainer>

          {/* Pagination */}
          <div className="pt-10 border-t border-white/5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  )
}