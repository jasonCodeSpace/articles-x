import { Suspense } from 'react'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { createAnonClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trending Articles From X | Xarticle',
  description: 'Discover the most engaging articles and insights shared on X. Our curated collection features thought-provoking pieces from technology leaders, entrepreneurs, and industry experts across AI, business, crypto, and culture.',
  openGraph: {
    title: 'Trending Articles From X | Xarticle',
    description: 'Discover the most engaging articles and insights shared on X. Our curated collection features thought-provoking pieces from technology leaders, entrepreneurs, and industry experts across AI, business, crypto, and culture.',
    url: 'https://www.xarticle.news/trending',
    siteName: 'Xarticle',
    type: 'website',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Xarticle — Trending Articles From X',
        type: 'image/webp'
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trending Articles From X | Xarticle',
    description: 'Discover the most engaging articles and insights shared on X. Curated from technology leaders, entrepreneurs, and industry experts across AI, business, crypto, and culture.',
    images: ['/og-image.webp'],
  },
  alternates: {
    canonical: 'https://www.xarticle.news/trending',
    languages: {
      'x-default': 'https://www.xarticle.news/trending',
      'en': 'https://www.xarticle.news/trending',
    }
  },
  robots: { index: true, follow: true },
}

// Use ISR with 5-minute revalidation
export const revalidate = 300

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string; category?: string }>
}

// Fetch articles directly (without cache to ensure fresh data)
async function getArticles(search?: string, category?: string): Promise<Article[]> {
  const supabase = createAnonClient()

  // Select all columns needed for display, including summaries for both languages and media
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
      score,
      article_images,
      article_videos,
      category,
      main_category,
      sub_category
    `)
    .eq('indexed', true) // Only show indexed articles
    .gte('score', 65) // Only show high-quality articles (score >= 65)
    .order('score', { ascending: false, nullsFirst: false }) // Sort by score (highest first)

  // Category filtering - support both main category and subcategory
  if (category && category !== 'all') {
    // If category contains ':', it's a specific subcategory (e.g., 'tech:ai')
    // Otherwise it's a main category (e.g., 'tech')
    if (category.includes(':')) {
      query = query.eq('category', category)
    } else {
      // Filter by main_category (e.g., 'tech' matches all 'tech:*' articles)
      query = query.eq('main_category', category)
    }
  }

  if (search && search.trim()) {
    // Search in title and full_article_content only (NOT in summaries)
    query = query.or(`title.ilike.%${search.trim()}%,title_english.ilike.%${search.trim()}%,full_article_content.ilike.%${search.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }

  // Map database fields to Article interface
  return (data || []).map(item => ({
    ...item,
    tags: [],
    created_at: item.article_published_at || item.updated_at || new Date().toISOString(),
  })) as Article[]
}

// Fetch all articles from database
async function fetchAllArticles(options: {
  search?: string
  category?: string
}): Promise<Article[]> {
  return getArticles(options.search, options.category)
}

export default async function TrendingPage({ searchParams }: PageProps) {
  const { search, category } = await searchParams

  // Fetch all articles
  const articles = await fetchAllArticles({ search, category })

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
          <div className="absolute -top-[10%] left-[10%] w-[30%] h-[30%] bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
          <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
        </div>

        <main className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-20">
          <header className="mb-16 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                Trending <span className="text-white/40">reads.</span>
              </h1>
              <p className="text-white/40 text-lg font-light max-w-2xl">
                Discover thought-provoking articles and insights shared by industry leaders on X. From breakthrough technologies to emerging market trends, explore curated content that sparks ideas and drives meaningful discussions.
              </p>
            </div>

          </header>

          <section aria-labelledby="feed">
            <h2 id="feed" className="sr-only">Article Feed</h2>
            <Suspense fallback={<FeedLoading />}>
              <ArticleFeed
                initialArticles={articles}
                initialSearchQuery={search || ''}
                initialCategory={category || 'all'}
              />
            </Suspense>
          </section>
        </main>
      </div>
    </>
  )
}
