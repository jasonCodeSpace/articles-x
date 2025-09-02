import { Suspense } from 'react'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Articles | xarticle.news',
  description: 'Stay updated with the latest curated articles and trending news. Discover current conversations, breaking stories, and insights from leading voices across technology, business, and more.',
}

// Enable ISR for better TTFB performance
export const dynamic = 'force-static'
export const revalidate = 60 // Revalidate every 60 seconds for ISR

// Generate static params for both daily and weekly views
export async function generateStaticParams() {
  return [
    {}, // Default (daily)
    { filter: 'week' }, // Weekly
  ]
}

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; page?: string; filter?: string }>
}

// Custom fetch function for Trending articles (Day or Week tags)
async function fetchTrendingArticles(options: {
  search?: string
  category?: string
  limit?: number
  sort?: 'newest' | 'oldest'
  language?: string
  filter?: string
}): Promise<Article[]> {
  const supabase = await createClient()
  
  // Trending page should always show both Day and Week tagged articles
  const tagsToFilter = ['Day', 'Week']
  
  let query = supabase
    .from('articles')
    .select(`
      *,
      summary_chinese,
      summary_english,
      summary_generated_at
    `)
    .in('tag', tagsToFilter)
    .order('article_published_at', { ascending: false })
    .limit(1000)
  
  if (options.search && options.search.trim()) {
    query = query.or(`title.ilike.%${options.search.trim()}%,author_name.ilike.%${options.search.trim()}%,author_handle.ilike.%${options.search.trim()}%`)
  }
  
  if (options.category && options.category !== 'all' && options.category.trim()) {
    query = query.eq('category', options.category.trim())
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching trending articles:', error)
    return []
  }
  
  return data || []
}

export default async function TrendingPage({ searchParams }: PageProps) {
  const { category, search, filter } = await searchParams
  
  // Fetch Trending articles (Day or Week tags)
  const articles = await fetchTrendingArticles({ category, search, filter })

  // Generate JSON-LD structured data for articles
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Trending X Posts & News",
    "description": "Latest curated X posts and trending news from leading voices",
    "url": "https://xarticle.news/trending",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": articles.slice(0, 10).map((article, index) => ({
        "@type": "NewsArticle",
        "position": index + 1,
        "headline": article.title,
        "datePublished": article.article_published_at,
        "author": {
          "@type": "Person",
          "name": article.author_name,
          "url": `https://x.com/${article.author_handle}`
        },
        "publisher": {
          "@type": "Organization",
          "name": "xarticle.news",
          "url": "https://xarticle.news"
        },
        "url": article.article_url
      }))
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-24 pb-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              All Articles
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stay updated with the latest curated articles from leading voices
            </p>
          </div>
          
          <Suspense fallback={<FeedLoading />}>
            <ArticleFeed 
              initialArticles={articles} 
              initialSearchQuery={search || ''}
            />
          </Suspense>
        </div>
      </div>
    </>
  )
}