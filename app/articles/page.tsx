import { Suspense } from 'react'
import { fetchArticles, getArticleCategories } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'


interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const { category, search, page: _page } = await searchParams
  
  const [articles, categories] = await Promise.all([
    fetchArticles({ category, search }),
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