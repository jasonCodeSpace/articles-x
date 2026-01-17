import { Suspense } from 'react'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'
import { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Trending Articles From X | Xarticle',
  description: 'Discover the latest curated reads from leading voices on X. Explore tech, business, crypto, and culture with fast search and clean, noise-free reading.',
  openGraph: {
    title: 'Trending Articles From X | Xarticle',
    description: 'Curated, up-to-date reads from leading voices on X across tech, business, crypto, and more.',
    url: 'https://www.xarticle.news/trending',
    siteName: 'Xarticle',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Xarticle — Trending Articles From X',
        type: 'image/png'
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trending Articles From X | Xarticle',
    description: 'Curated, up-to-date reads from leading voices on X.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://www.xarticle.news/trending' },
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



// Custom fetch function for Trending articles from article_main table
async function fetchTrendingArticles(options: {
  search?: string
  category?: string
  limit?: number
  sort?: 'newest' | 'oldest'
  language?: string
  filter?: string
}): Promise<Article[]> {
  const supabase = await createClient()

  let query = supabase
    .from('articles')
    .select(`
      *,
      summary_english,
      summary_generated_at
    `)
    .order('article_published_at', { ascending: false })
    .limit(1000)

  if (options.search && options.search.trim()) {
    query = query.or(`title.ilike.%${options.search.trim()}%,title_english.ilike.%${options.search.trim()}%`)
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
      <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20">
        {/* Decorative background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] left-[10%] w-[30%] h-[30%] bg-white/[0.02] rounded-full blur-[120px]" />
          <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-white/[0.02] rounded-full blur-[120px]" />
        </div>

        <main className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-20">
          <header className="mb-16 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                Trending <span className="text-white/40">reads.</span>
              </h1>
              <p className="text-white/40 text-lg font-light max-w-lg">
                The latest high-value articles and threads, filtered across all categories.
              </p>
            </div>

            <Link href="/summary" className="group relative w-full lg:w-96 p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all duration-500 overflow-hidden shadow-2xl flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="text-white/70" size={24} />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Daily Briefing</div>
                <h3 className="text-xl font-medium text-white/90 group-hover:text-white transition-colors">Daily AI Report</h3>
                <p className="text-xs text-white/40 font-light leading-relaxed">
                  Summarized insights from today&apos;s best content.
                </p>
              </div>
            </Link>
          </header>

          <section aria-labelledby="feed">
            <h2 id="feed" className="sr-only">Article Feed</h2>
            <Suspense fallback={<FeedLoading />}>
              <ArticleFeed
                initialArticles={articles}
                initialSearchQuery={search || ''}
                initialCategory={category || 'All'}
              />
            </Suspense>
          </section>
        </main>
      </div>
    </>
  )
}