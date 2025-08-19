import { Suspense } from 'react'
import { fetchArticles, getArticleCategories, getArticleStats } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Fetch data in parallel
  const [articles, categories, stats] = await Promise.all([
    fetchArticles({ limit: 50 }),
    getArticleCategories(),
    getArticleStats()
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Articles Feed</h1>
          <p className="mt-2 text-gray-300">
            Read the best articles from X — noise-free.
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl">
            <FileText className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-white">
              {stats.total} Articles
            </span>
          </div>
        </div>
      </div>

      {/* Article Feed */}
      <Suspense fallback={<FeedLoading />}>
        <ArticleFeed 
          initialArticles={articles}
          initialCategories={categories}
        />
      </Suspense>
    </div>
  )
}