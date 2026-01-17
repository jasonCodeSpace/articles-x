'use client'

import dynamic from 'next/dynamic'
import { ArticleCard, Article } from '@/components/article-card'
import { FeedEmptyState } from '@/components/feed-empty-state'
import { useArticleFeed, TimePeriod, DisplayLanguage } from '@/hooks/use-article-feed'
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
  initialTimePeriod?: TimePeriod
  initialLanguage?: DisplayLanguage
}

export function ArticleFeed({
  initialArticles,
  initialSearchQuery = '',
  initialCategory = 'All',
  initialTimePeriod = 'all',
  initialLanguage = 'en'
}: ArticleFeedProps) {
  const {
    paginatedArticles,
    isLoading: feedLoading,
    error,
    searchQuery,
    sortOption,
    selectedCategory,
    selectedTimePeriod,
    displayLanguage,
    currentPage,
    totalPages,
    totalItems,
    handleSearch,
    handleSort,
    handleCategoryChange,
    handleTimePeriodChange,
    handleLanguageChange,
    handlePageChange,
    clearFilters,
    retry,
  } = useArticleFeed({
    initialArticles,
    initialSearchQuery,
    initialCategory,
    initialTimePeriod,
    initialLanguage,
    itemsPerPage: 12
  })

  // Convert sortOption to sortBy for toolbar
  const sortBy = sortOption === 'views_high' ? 'hot' : 'latest'

  const handleSortByChange = (newSortBy: 'latest' | 'hot') => {
    handleSort(newSortBy === 'hot' ? 'views_high' : 'newest')
  }

  if (feedLoading) {
    return <FeedLoading />
  }

  const hasActiveFilters = searchQuery || selectedCategory !== 'All' || selectedTimePeriod !== 'all'

  return (
    <div className="space-y-12">
      {/* Feed Toolbar */}
      <section className="transition-all duration-300">
        <FeedToolbar
          onSearchChange={handleSearch}
          searchValue={searchQuery}
          isLoading={feedLoading}
          sortBy={sortBy}
          onSortChange={handleSortByChange}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          selectedTimePeriod={selectedTimePeriod}
          onTimePeriodChange={handleTimePeriodChange}
          displayLanguage={displayLanguage}
          onLanguageChange={handleLanguageChange}
          totalItems={totalItems}
        />
      </section>

      {error === 'no-results' || paginatedArticles.length === 0 ? (
        <FeedEmptyState
          type="no-results"
          searchQuery={hasActiveFilters ? (searchQuery || selectedCategory || selectedTimePeriod) : ''}
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
        <div className="space-y-20">
          <StaggerContainer staggerChildren={0.05} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedArticles.map((article: Article, index: number) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
                priority={index < 6}
                displayLanguage={displayLanguage}
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
