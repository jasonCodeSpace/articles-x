import { Metadata } from 'next'
import { Suspense } from 'react'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { createAnonClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'

interface MetadataParams {
  searchParams: Promise<{ search?: string; page?: string; category?: string }>
}

export async function generateMetadata({ searchParams }: MetadataParams): Promise<Metadata> {
  const { category } = await searchParams
  const baseUrl = 'https://www.xarticle.news'

  if (category && category !== 'all') {
    const categoryName = category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    const canonicalUrl = `${baseUrl}/trending?category=${encodeURIComponent(category)}`

    return {
      title: `${categoryName} Articles from X | Xarticle`,
      description: `Discover the most engaging ${categoryName.toLowerCase()} articles and insights shared on X.`,
      openGraph: {
        title: `${categoryName} Articles from X | Xarticle`,
        description: `Discover the most engaging ${categoryName.toLowerCase()} articles and insights shared on X.`,
        url: canonicalUrl,
        siteName: 'Xarticle',
        type: 'website',
        images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: `Xarticle — ${categoryName} Articles`, type: 'image/webp' }],
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${categoryName} Articles from X | Xarticle`,
        description: `Discover the most engaging ${categoryName.toLowerCase()} articles and insights shared on X.`,
        images: ['/og-image.webp'],
      },
      alternates: {
        canonical: canonicalUrl,
        languages: { 'x-default': canonicalUrl, 'en': canonicalUrl }
      },
      robots: { index: true, follow: true },
    }
  }

  return {
    title: 'Trending Articles From X | Xarticle',
    description: 'Discover the most engaging articles and insights shared on X. Curated from technology leaders, entrepreneurs, and industry experts.',
    openGraph: {
      title: 'Trending Articles From X | Xarticle',
      description: 'Discover the most engaging articles and insights shared on X.',
      url: 'https://www.xarticle.news/trending',
      siteName: 'Xarticle',
      type: 'website',
      images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: 'Xarticle — Trending Articles', type: 'image/webp' }],
      locale: 'en_US',
    },
    alternates: {
      canonical: 'https://www.xarticle.news/trending',
      languages: { 'x-default': 'https://www.xarticle.news/trending', 'en': 'https://www.xarticle.news/trending' }
    },
    robots: { index: true, follow: true },
  }
}

export const revalidate = 300

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string; category?: string }>
}

async function getArticles(search?: string, category?: string): Promise<Article[]> {
  const supabase = createAnonClient()

  let query = supabase
    .from('articles')
    .select('id, title, title_english, slug, image, author_name, author_handle, author_avatar, article_published_at, updated_at, tweet_views, tweet_replies, tweet_likes, article_url, language, summary_english, summary_chinese, summary_generated_at, full_article_content, score, article_images, article_videos, category, main_category, sub_category')
    .eq('indexed', true)
    .gte('score', 65)
    .order('score', { ascending: false, nullsFirst: false })

  if (category && category !== 'all') {
    if (category.includes(':')) {
      query = query.eq('category', category)
    } else {
      query = query.eq('main_category', category)
    }
  }

  if (search && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,title_english.ilike.%${search.trim()}%,full_article_content.ilike.%${search.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }

  return (data || []).map(item => ({
    ...item,
    tags: [],
    created_at: item.article_published_at || item.updated_at || new Date().toISOString(),
  })) as Article[]
}

export default async function TrendingPage({ searchParams }: PageProps) {
  const { search, category } = await searchParams
  const articles = await getArticles(search, category)

  // Simplified structured data - smaller size
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Trending X Posts & News",
    "description": "Latest curated X posts and trending news",
    "url": "https://xarticle.news/trending"
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20">
        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-16">
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              {category && category !== 'all'
                ? `${category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
                : 'Trending'} <span className="text-white/40">articles.</span>
            </h1>
            <p className="text-white/40 text-sm md:text-base max-w-2xl">
              Curated content from technology leaders, entrepreneurs, and industry experts.
            </p>
          </header>

          <section>
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
