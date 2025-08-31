'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArticleCard, Article } from '@/components/article-card'
import { FeedLoading } from '@/components/feed-loading'
import { FeedEmptyState } from '@/components/feed-empty-state'
import { Pagination } from '@/components/pagination'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface AuthorInfo {
  full_name: string
  username: string
  avatar_url?: string
  articleCount: number
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export default function AuthorPage() {
  const params = useParams()
  const handle = params.handle as string
  const [authorInfo, setAuthorInfo] = useState<AuthorInfo | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/author/${encodeURIComponent(handle)}?page=${currentPage}&limit=9`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch author data')
        }
        
        const data = await response.json()
        setAuthorInfo(data.author)
        setArticles(data.articles)
        setPagination(data.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (handle) {
      fetchAuthorData()
    }
  }, [handle, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <FeedLoading />
        </div>
      </div>
    )
  }

  if (error || !authorInfo) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <FeedEmptyState 
            type="error"
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    )
  }

  const authorInitials = (authorInfo.full_name || '')
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link 
          href="/articles" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Link>

        {/* Author header */}
        <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-gray-600">
              {authorInfo.avatar_url ? (
                <AvatarImage 
                  src={authorInfo.avatar_url} 
                  alt={`${authorInfo.full_name} profile picture`}
                />
              ) : null}
              <AvatarFallback className="text-lg font-medium bg-gray-600 text-white">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{authorInfo.full_name}</h1>
              <p className="text-gray-400 mb-2">@{authorInfo.username}</p>
              <p className="text-sm text-gray-500">
                {authorInfo.articleCount} {authorInfo.articleCount === 1 ? 'article' : 'articles'}
              </p>
            </div>
          </div>
        </div>

        {/* Articles grid */}
        {articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <FeedEmptyState 
            type="no-articles"
          />
        )}
      </div>
    </div>
  )
}