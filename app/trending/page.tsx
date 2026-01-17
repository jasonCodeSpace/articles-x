import { Suspense } from 'react'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { createAnonClient } from '@/lib/supabase/server'
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

// Use dynamic rendering since we need cookies() for Supabase auth
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

// Fetch articles directly (without cache to ensure fresh data)
async function getArticles(search?: string): Promise<Article[]> {
  const supabase = createAnonClient()

  // Select all columns needed for display, including summaries for both languages
  let query = supabase
    .from('articles')
    .select(`
      id,
      title,
      title_english,
      slug,
      image,
      category,
      author_name,
      author_handle,
      author_avatar,
      article_published_at,
      updated_at,
      tag,
      tweet_views,
      tweet_replies,
      tweet_likes,
      article_url,
      language,
      summary_english,
      summary_chinese,
      summary_generated_at
    `)
    .order('article_published_at', { ascending: false, nullsFirst: false })

  if (search && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,title_english.ilike.%${search.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }

  // Map database fields to Article interface
  return (data || []).map(item => ({
    ...item,
    tags: item.tag ? item.tag.split(',').map((t: string) => t.trim()) : [],
    created_at: item.article_published_at || item.updated_at || new Date().toISOString(),
  })) as Article[]
}

// Fetch all articles from database
async function fetchAllArticles(options: {
  search?: string
}): Promise<Article[]> {
  return getArticles(options.search)
}

export default async function TrendingPage({ searchParams }: PageProps) {
  const { search } = await searchParams

  // Fetch all articles
  const articles = await fetchAllArticles({ search })

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
                The latest high-value articles and threads from X.
              </p>
            </div>

            <Link href="/summary" className="group relative w-full lg:w-96 p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all duration-500 overflow-hidden shadow-2xl flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="text-white/70" size={24} />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Daily Briefing</div>
                <h3 className="text-xl font-medium text-white/90 group-hover:text-white transition-colors">Daily Report</h3>
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
              />
            </Suspense>
          </section>
        </main>
      </div>
    </>
  )
}
