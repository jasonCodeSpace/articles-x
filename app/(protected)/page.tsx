import { Suspense } from 'react'
import { fetchArticles, getArticleCategories, getArticleStats } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { FileText } from 'lucide-react'

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
          <h1 className="text-3xl font-bold text-gray-900">Articles Feed</h1>
          <p className="mt-2 text-gray-600">
            Discover the latest articles from your curated Twitter lists
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
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