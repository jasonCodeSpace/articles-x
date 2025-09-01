'use client'

import { ArticleCard, Article } from '@/components/article-card'
import { FeedEmptyState } from '@/components/feed-empty-state'
import { FeedLoading } from '@/components/feed-loading'
import { FeedToolbar } from '@/components/feed-toolbar'
import { Pagination } from '@/components/pagination'
import { useArticleFeed } from '@/hooks/use-article-feed'


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
    selectedCategory,
    selectedLanguage,
    categories,
    currentPage,
    totalPages,
    handleSearch,
    handleCategoryChange,
    handleLanguageChange,
    handlePageChange,
    clearSearch,
    retry,
  } = useArticleFeed({
    initialArticles,
    initialCategories,
    initialCategory,
    initialSearchQuery,
    itemsPerPage: 20,
  })

  if (isLoading) {
    return <FeedLoading />
  }

  return (
    <div className="space-y-4">
      {/* Feed Toolbar */}
      <FeedToolbar
          onSearchChange={handleSearch}
          onCategoryChange={handleCategoryChange}
          onLanguageChange={handleLanguageChange}
          currentCategory={selectedCategory}
          currentLanguage={selectedLanguage}
          searchValue={searchQuery}
          categories={categories}
          isLoading={isLoading}
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
            {paginatedArticles.slice(0, 18).map((article: Article, index: number) => (
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