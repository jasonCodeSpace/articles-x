import { Suspense } from 'react'
import Link from 'next/link'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { createAnonClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Article Archive | Xarticle',
  description: 'Browse the archive of articles with score below 65. These articles are still indexed but receive lower priority for search engines.',
  openGraph: {
    title: 'Article Archive | Xarticle',
    description: 'Archive of articles with score below 65 from X.',
    url: 'https://www.xarticle.news/archive',
    siteName: 'Xarticle',
    type: 'website',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Xarticle — Article Archive',
        type: 'image/webp'
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Article Archive | Xarticle',
    description: 'Archive of articles with score below 65 from leading voices on X.',
    images: ['/og-image.webp'],
  },
  alternates: {
    canonical: 'https://www.xarticle.news/archive',
  },
  robots: { index: true, follow: true },
}

// Use ISR with 5-minute revalidation
export const revalidate = 300

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

// Fetch articles with score < 65 for archive
async function getArchivedArticles(search?: string): Promise<Article[]> {
  const supabase = createAnonClient()

  // Select all columns needed for display
  let query = supabase
    .from('articles')
    .select(`
      id,
      title,
      title_english,
      slug,
      image,
      author_name,
      author_handle,
      author_avatar,
      article_published_at,
      updated_at,
      tweet_views,
      tweet_replies,
      tweet_likes,
      article_url,
      language,
      summary_english,
      summary_chinese,
      summary_generated_at,
      full_article_content,
      indexed,
      score
    `)
    .eq('indexed', true) // Only show indexed articles
    .lt('score', 65) // Only show articles with score < 65
    .order('score', { ascending: false, nullsFirst: false }) // Sort by score (high to low)

  if (search && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,title_english.ilike.%${search.trim()}%,full_article_content.ilike.%${search.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching archived articles:', error)
    return []
  }

  return (data || []).map(item => ({
    ...item,
    tags: [],
    created_at: item.article_published_at || item.updated_at || new Date().toISOString(),
  })) as Article[]
}

// Fetch stats for low-score articles
async function getArchiveStats(): Promise<{ total: number; avgScore: number }> {
  const supabase = createAnonClient()

  const { data, error } = await supabase
    .from('articles')
    .select('score')
    .eq('indexed', true)
    .lt('score', 65) // Only count articles with score < 65

  if (error || !data || data.length === 0) {
    return { total: 0, avgScore: 0 }
  }

  const total = data.length
  const avgScore = data.reduce((sum, item) => sum + (item.score || 0), 0) / total

  return { total, avgScore: Math.round(avgScore) }
}

export default async function ArchivePage({ searchParams }: PageProps) {
  const { search } = await searchParams

  const articles = await getArchivedArticles(search)
  const stats = await getArchiveStats()

  // Generate JSON-LD structured data

  // Generate JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "X Article Archive",
    "description": "Archive of articles with score below 65 from leading voices on X",
    "url": "https://xarticle.news/archive",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": articles.length,
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
          <div className="absolute -top-[10%] left-[10%] w-[30%] h-[30%] bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
          <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
        </div>

        <main className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-20">
          <header className="mb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                  Archive <span className="text-white/40">vault.</span>
                </h1>
                <p className="text-white/40 text-lg font-light max-w-lg">
                  Articles with score below 65. Sorted by score (highest first).
                </p>
              </div>
              <div className="flex gap-8 text-sm">
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-white/40">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.avgScore}</div>
                  <div className="text-white/40">Avg Score</div>
                </div>
              </div>
              <Link
                href="/"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </header>

          <section aria-labelledby="archive">
            <h2 id="archive" className="sr-only">Article Archive</h2>
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
