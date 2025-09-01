import { Suspense } from 'react'
import { fetchArticles, getArticleCategories } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History | Articles X',
  description: 'Browse historical articles and archives',
}

// Enable static generation
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const { category, search } = await searchParams
  
  // Fetch History and Week tagged articles
  const [articles, categories] = await Promise.all([
    fetchArticles({ category, search, tags: ['History', 'Week'] }),
    getArticleCategories()
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-24 pb-6">
      <div className="space-y-6">
        <Suspense fallback={<FeedLoading />}>
          <ArticleFeed 
            initialArticles={articles} 
            initialCategories={categories}
            initialCategory={category || 'all'}
            initialSearchQuery={search || ''}
          />
        </Suspense>
      </div>
    </div>
  )
}