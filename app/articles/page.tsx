import { Suspense } from 'react'
import { fetchArticles, getArticleCategories } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'



export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Fetch data in parallel
  const [articles, categories] = await Promise.all([
    fetchArticles({ limit: 100 }),
    getArticleCategories()
  ])

  return (
    <div className="min-h-screen relative">
      {/* Subtle background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      
      {/* X.com style main content */}
      <div className="border-x border-gray-800 min-h-screen bg-black/90 backdrop-blur-sm relative z-10">
        {/* Article Feed */}
        <div className="relative z-10">
          <Suspense fallback={<FeedLoading />}>
            <ArticleFeed 
              initialArticles={articles}
              initialCategories={categories}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}