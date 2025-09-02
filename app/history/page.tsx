import { Suspense } from 'react'
import { fetchArticles } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Archive of X Articles | xarticle.news',
  description: 'Explore our complete archive of curated X articles and past discussions. Browse historical content by date, category, and discover valuable insights from previous conversations.',
}

// Enable dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const { category, search } = await searchParams
  
  // Fetch History and Week tagged articles with reduced limit to prevent timeout
  const articles = await fetchArticles({ category, search, tags: ['History', 'Week'], limit: 500 })

  // Group articles by month for date browsing
  const articlesByMonth = articles.reduce((acc, article) => {
    const date = new Date(article.article_published_at || article.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    
    if (!acc[monthKey]) {
      acc[monthKey] = { name: monthName, articles: [] }
    }
    acc[monthKey].articles.push(article)
    return acc
  }, {} as Record<string, { name: string; articles: typeof articles }>)



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-24 pb-6">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Archive of Past X Articles
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore our complete archive of curated articles and discover valuable insights from past discussions
          </p>
        </div>
        

        
        {/* All Articles Feed */}
        <div className="space-y-4">
          <Suspense fallback={<FeedLoading />}>
            <ArticleFeed 
              initialArticles={articles} 
              initialSearchQuery={search || ''}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}