import { Suspense } from 'react'
import { fetchArticles } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Article } from '@/components/article-card'
import { generateCategorySlug, categorySlugToDisplayName } from '@/lib/url-utils'

interface PageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{ search?: string; page?: string }>
}

// Generate metadata for category pages
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const decodedCategory = categorySlugToDisplayName(category)
  const slug = category.toLowerCase()
  
  return {
    title: `${decodedCategory} Articles: Expert Insights from X | Xarticle`,
    description: `Explore ${decodedCategory.toLowerCase()} articles curated from top X voices. Get AI-powered summaries of the most valuable insights and discussions in ${decodedCategory.toLowerCase()}.`,
    alternates: { 
      canonical: `https://www.xarticle.news/category/${slug}`,
      languages: {
        'en': `https://www.xarticle.news/en/category/${slug}`,
        'zh': `https://www.xarticle.news/zh/category/${slug}`,
        'x-default': `https://www.xarticle.news/en/category/${slug}`
      }
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      url: `https://www.xarticle.news/category/${slug}`,
      title: `${decodedCategory} Articles: Expert Insights from X | Xarticle`,
      description: `Explore ${decodedCategory.toLowerCase()} articles curated from top X voices. Get AI-powered summaries of the most valuable insights.`,
      locale: 'en_US',
      alternateLocale: 'zh_CN'
    },
    twitter: {
      card: 'summary',
      title: `${decodedCategory} Articles from X`,
      description: `Curated ${decodedCategory.toLowerCase()} insights from top X voices.`,
    },
  }
}

// Enable static generation for standard categories only
export async function generateStaticParams() {
  const standardCategories = [
    'Hardware',
    'Gaming',
    'Health',
    'Environment',
    'Personal Story',
    'Culture',
    'Philosophy',
    'History',
    'Education',
    'Design',
    'Marketing',
    'AI',
    'Crypto',
    'Tech',
    'Data',
    'Startups',
    'Business',
    'Markets',
    'Product',
    'Security',
    'Policy',
    'Science',
    'Media'
  ]
  
  // Generate static params for standard categories
  return standardCategories.map((category) => ({
    category: generateCategorySlug(category),
  }))
}

export const dynamic = 'force-static'
export const revalidate = 120 // Revalidate every 2 minutes for better TTFB

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params
  const { search } = await searchParams
  const slug = category.toLowerCase()
  const decodedCategory = categorySlugToDisplayName(slug)
  
  // Define standard categories that are allowed
  const standardCategories = [
    'Hardware',
    'Gaming', 
    'Health',
    'Environment',
    'Personal Story',
    'Culture',
    'Philosophy',
    'History',
    'Education',
    'Design',
    'Marketing',
    'AI',
    'Crypto',
    'Tech',
    'Data',
    'Startups',
    'Business',
    'Markets',
    'Product',
    'Security',
    'Policy',
    'Science',
    'Media'
  ]
  
  // Check if category contains comma or is not a standard category - if so, return 404
  if (decodedCategory.includes(',') || 
      (slug !== 'all' && !standardCategories.some(cat => cat.toLowerCase() === decodedCategory.toLowerCase()))) {
    notFound()
  }
  
  // Special handling for "all" category to show all articles
  let articles: Article[]
  if (slug === 'all') {
    // For "all" category, fetch all articles without category filter
    articles = await fetchArticles({ search })
  } else {
    // Fetch a recent slice and filter locally to avoid heavy DB scans/timeouts
    const allArticles = await fetchArticles({ search, limit: 300 })
    
    // Client-side filter to ensure exact category match (case-insensitive)
    articles = allArticles.filter((article: Article) => {
      if (!article.category) return false
      const categories = article.category.split(',').map(cat => cat.trim())
      return categories.some(cat => cat.toLowerCase() === decodedCategory.toLowerCase())
    })
  }
  

  
  // Generate JSON-LD structured data for category page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${decodedCategory} Articles`,
    "description": `Curated articles about ${decodedCategory}`,
    "url": `https://xarticle.news/category/${slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": articles.slice(0, 10).map((article: Article, index: number) => ({
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

  // Generate breadcrumb structured data
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://xarticle.news"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Categories",
        "item": "https://xarticle.news/category"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": decodedCategory,
        "item": `https://xarticle.news/category/${slug}`
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 md:pt-24 pb-6">
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/category" className="hover:text-foreground transition-colors">
                  Categories
                </Link>
              </li>
              <li>/</li>
              <li aria-current="page" className="text-foreground font-medium">{decodedCategory}</li>
            </ol>
          </nav>
          
          {/* Page Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {decodedCategory} Articles
            </h1>
            <div className="text-xl text-muted-foreground max-w-3xl mx-auto">
              <p>
                Daily curated {decodedCategory.toLowerCase()} articles from X, updated regularly.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <span>{articles.length} articles found</span>
              {articles.length > 0 && (
                <span>•</span>
              )}
              {articles.length > 0 && (
                <span>Updated regularly</span>
              )}
            </div>
          </div>
          
          {/* Articles Feed */}
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
    </>
  )
}
