import { Suspense } from 'react'
import { getArticleCategories } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Latest X Posts & Trending News | xarticle.news',
  description: 'Stay updated with the latest curated X posts and trending news. Discover current conversations, breaking stories, and insights from leading voices across technology, business, and more.',
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

// Custom fetch function for New articles (Day or Week tags)
async function fetchNewArticles(options: {
  search?: string
  category?: string
  limit?: number
  sort?: 'newest' | 'oldest'
  language?: string
  filter?: string
}): Promise<Article[]> {
  const supabase = await createClient()
  
  // Determine which tags to filter by based on filter parameter
  let tagsToFilter: string[]
  if (options.filter === 'week') {
    // Weekly Article page should include both Week and Day tagged articles
    tagsToFilter = ['Week', 'Day']
  } else {
    tagsToFilter = ['Day']
  }
  
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
    .limit(10000)
  
  if (options.search && options.search.trim()) {
    query = query.or(`title.ilike.%${options.search.trim()}%,author_name.ilike.%${options.search.trim()}%,author_handle.ilike.%${options.search.trim()}%`)
  }
  
  if (options.category && options.category !== 'all' && options.category.trim()) {
    query = query.eq('category', options.category.trim())
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching new articles:', error)
    return []
  }
  
  return data || []
}

export default async function NewPage({ searchParams }: PageProps) {
  const { category, search, filter } = await searchParams
  
  // Fetch New articles (Day or Week tags) and categories
  const [articles, categories] = await Promise.all([
    fetchNewArticles({ category, search, filter }),
    getArticleCategories()
  ])

  // Generate JSON-LD structured data for articles
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Latest X Posts & Trending News",
    "description": "Latest curated X posts and trending news from leading voices",
    "url": "https://xarticle.news/new",
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
              Latest X Posts & Trending News
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stay updated with the latest curated posts and current conversations from leading voices on X
            </p>
          </div>
          
          <Suspense fallback={<FeedLoading />}>
            <ArticleFeed 
              initialArticles={articles} 
              initialCategories={categories}
              initialCategory={category || 'all'}
              initialSearchQuery={search || ''}
            />
          </Suspense>
          
          {/* Tags Section */}
          <div className="mt-12 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground border-b border-border pb-2">
              Popular Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 15).map((cat) => (
                <span key={cat} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}