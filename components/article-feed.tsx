'use client'

import { ArticleCardMemo, Article } from '@/components/article-card'
import { FeedEmptyState } from '@/components/feed-empty-state'
import { useArticleFeed } from '@/hooks/use-article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { FeedToolbar } from '@/components/feed/toolbar'
import { Pagination } from '@/components/pagination'
import type { TimePeriod, DisplayLanguage } from '@/components/feed'

interface ArticleFeedProps {
  initialArticles: Article[]
  initialSearchQuery?: string
  initialTimePeriod?: TimePeriod
  initialCategory?: string
  initialLanguage?: DisplayLanguage
}

export function ArticleFeed({
  initialArticles,
  initialSearchQuery = '',
  initialTimePeriod = 'all',
  initialCategory = 'all',
  initialLanguage = 'en'
}: ArticleFeedProps) {
  const {
    paginatedArticles,
    isLoading: feedLoading,
    error,
    searchQuery,
    sortOption,
    selectedTimePeriod,
    selectedCategory,
    displayLanguage,
    currentPage,
    totalPages,
    totalItems,
    handleSearch,
    handleSort,
    handleTimePeriodChange,
    handleCategoryChange,
    handleLanguageChange,
    handlePageChange,
    clearFilters,
    retry,
  } = useArticleFeed({
    initialArticles,
    initialSearchQuery,
    initialTimePeriod,
    initialCategory,
    initialLanguage,
    itemsPerPage: 9  // Reduced from 12 to improve performance
  })

  const sortBy = sortOption === 'views_high' ? 'hot' : 'latest'

  const handleSortByChange = (newSortBy: 'latest' | 'hot') => {
    handleSort(newSortBy === 'hot' ? 'views_high' : 'newest')
  }

  if (feedLoading) {
    return <FeedLoading />
  }

  const hasActiveFilters = searchQuery || selectedTimePeriod !== 'all'

  return (
    <div className="space-y-8">
      <FeedToolbar
        onSearchChange={handleSearch}
        searchValue={searchQuery}
        isLoading={feedLoading}
        sortBy={sortBy}
        onSortChange={handleSortByChange}
        selectedTimePeriod={selectedTimePeriod}
        onTimePeriodChange={handleTimePeriodChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        displayLanguage={displayLanguage}
        onLanguageChange={handleLanguageChange}
        totalItems={totalItems}
      />

      {error === 'no-results' || paginatedArticles.length === 0 ? (
        <FeedEmptyState
          type="no-results"
          searchQuery={hasActiveFilters ? (searchQuery || selectedTimePeriod) : ''}
          onClearSearch={clearFilters}
        />
      ) : initialArticles.length === 0 ? (
        <FeedEmptyState type="no-articles" />
      ) : error === 'error' ? (
        <FeedEmptyState
          type="error"
          onRetry={retry}
        />
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedArticles.map((article: Article, index: number) => (
              <div key={article.id}>
                <ArticleCardMemo
                  article={article}
                  index={index}
                  priority={index < 2}
                  displayLanguage={displayLanguage}
                />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pt-8 border-t border-white/5">
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
