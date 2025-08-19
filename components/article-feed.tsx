'use client'

import { ArticleCard, Article } from '@/components/article-card'
import { FeedToolbar } from '@/components/feed-toolbar'
import { FeedEmptyState } from '@/components/feed-empty-state'
import { FeedLoading } from '@/components/feed-loading'
import { useArticleFeed } from '@/hooks/use-article-feed'

interface ArticleFeedProps {
  initialArticles: Article[]
  initialCategories: string[]
}

export function ArticleFeed({ initialArticles, initialCategories }: ArticleFeedProps) {
  const {
    filteredArticles,
    isLoading,
    error,
    searchQuery,
    sortOption,
    selectedCategory,
    categories,
    handleSearch,
    handleSort,
    handleCategoryChange,
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
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <FeedToolbar
          onSearchChange={handleSearch}
          onSortChange={handleSort}
          onCategoryChange={handleCategoryChange}
          currentSort={sortOption}
          currentCategory={selectedCategory}
          searchValue={searchQuery}
          categories={categories}
          isLoading={isLoading}
        />
      </div>

      {/* Results Count */}
      {!error && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </p>
        </div>
      )}

      {/* Feed Content */}
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
      ) : filteredArticles.length === 0 ? (
        <FeedEmptyState
          type="no-results"
          onClearSearch={clearSearch}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              className="h-full"
            />
          ))}
        </div>
      )}
    </div>
  )
}