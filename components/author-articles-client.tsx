'use client'

import { useState, useEffect } from 'react'
import { ArticleCard, Article } from '@/components/article-card'
import { FeedLoading } from '@/components/feed-loading'
import { FeedEmptyState } from '@/components/feed-empty-state'
import { Pagination } from '@/components/pagination'
import { AuthorPageToolbar } from '@/components/author-page-toolbar'
import { LanguageProvider } from '@/contexts/language-context'

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface AuthorArticlesClientProps {
  handle: string
  initialArticles: Article[]
  initialPagination: PaginationInfo
}

export function AuthorArticlesClient({
  handle,
  initialArticles,
  initialPagination
}: AuthorArticlesClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage)

  useEffect(() => {
    if (currentPage === initialPagination.currentPage) return

    const fetchPage = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/author/${encodeURIComponent(handle)}?page=${currentPage}&limit=9`)

        if (!response.ok) {
          throw new Error('Failed to fetch author data')
        }

        const data = await response.json()
        setArticles(data.articles)
        setPagination(data.pagination)
      } catch (err) {
        console.error('Error fetching page:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [handle, currentPage, initialPagination.currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return <FeedLoading />
  }

  return (
    <LanguageProvider>
      <AuthorPageToolbar />

      {articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <FeedEmptyState type="no-articles" />
      )}
    </LanguageProvider>
  )
}
