import { Suspense } from 'react'
import { fetchArticles } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Article } from '@/components/article-card'

interface PageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{ search?: string; page?: string }>
}

// Generate metadata for category pages
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const decodedCategory = decodeURIComponent(category)
  
  return {
    title: `${decodedCategory} Articles | xarticle.news`,
    description: `Discover curated articles about ${decodedCategory}. Stay updated with the latest posts, insights, and discussions from leading voices in ${decodedCategory}.`,
  }
}

// Enable static generation for standard categories only
export async function generateStaticParams() {
  const standardCategories = ['All Category', 'AI', 'Crypto', 'Tech', 'Data', 'Startups', 'Business', 'Markets', 'Product', 'Security', 'Policy', 'Science', 'Media']
  
  // Generate static params for standard categories
  return standardCategories.map((category) => ({
    category: encodeURIComponent(category),
  }))
}

export const dynamic = 'force-static'
export const revalidate = 120 // Revalidate every 2 minutes for better TTFB

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params
  const { search } = await searchParams
  const decodedCategory = decodeURIComponent(category)
  
  // Fetch articles for this category
  const articles = await fetchArticles({ category: decodedCategory, search })
  

  
  // Generate JSON-LD structured data for category page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${decodedCategory} Articles`,
    "description": `Curated articles about ${decodedCategory}`,
    "url": `https://xarticle.news/category/${encodeURIComponent(decodedCategory)}`,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-24 pb-6">
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/trending" className="hover:text-foreground transition-colors">
              Articles
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{decodedCategory}</span>
          </nav>
          
          {/* Page Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {decodedCategory} Articles
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover curated articles and insights about {decodedCategory} from leading voices on X
            </p>
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