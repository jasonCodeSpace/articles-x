import { Suspense } from 'react'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trending Articles From X | Xarticle',
  description: 'Discover the latest curated reads from leading voices on X. Explore tech, business, crypto, and culture with fast search and clean, noise-free reading.',
  openGraph: {
    title: 'Trending Articles From X | Xarticle',
    description: 'Curated, up-to-date reads from leading voices on X across tech, business, crypto, and more.',
    url: 'https://www.xarticle.news/',
    siteName: 'Xarticle',
    type: 'website',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Xarticle — Trending Articles From X',
        type: 'image/svg+xml'
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trending Articles From X | Xarticle',
    description: 'Curated, up-to-date reads from leading voices on X.',
    images: ['/og-image.svg'],
  },
  alternates: { canonical: 'https://www.xarticle.news/' },
  robots: { index: true, follow: true },
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

interface DailySummary {
  id: string
  date: string
  summary_content: string
  top_article_title: string
  created_at: string
}

// Fetch the latest daily summary
async function fetchLatestDailySummary(): Promise<DailySummary | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('daily_summary')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    console.error('Error fetching daily summary:', error)
    return null
  }
  
  return data
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
    // Use ilike to match category within comma-separated values
    query = query.ilike('category', `%${options.category.trim()}%`)
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
  
  // Fetch trending articles
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
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* H1 + 副标题 */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tight">
            Trending Articles From X
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            The latest curated reads from leading voices.
          </p>
        </header>



        {/* H2: Search（语义可见，视觉隐藏） */}
        <section aria-labelledby="search" className="mb-6">
          <h2 id="search" className="sr-only">Search</h2>
          {/* 搜索组件将通过ArticleFeed渲染 */}
        </section>

        {/* H2: Article Feed（语义可见，视觉隐藏；替代"Latest Trending Articles"可见标题） */}
        <section aria-labelledby="feed" className="mb-12">
          <h2 id="feed" className="sr-only">Article Feed</h2>
          <Suspense fallback={<FeedLoading />}>
            <ArticleFeed 
            initialArticles={articles} 
            initialSearchQuery={search || ''}
          />
          </Suspense>
        </section>
      </main>
    </>
  )
}