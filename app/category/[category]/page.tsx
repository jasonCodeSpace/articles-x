import { Suspense } from 'react'
import { fetchArticles, getArticleCategories } from '@/lib/articles'
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
    title: `${decodedCategory} Articles from X | xarticle.news`,
    description: `Discover curated X articles about ${decodedCategory}. Stay updated with the latest posts, insights, and discussions from leading voices in ${decodedCategory}.`,
  }
}

// Enable static generation for standard categories only
export async function generateStaticParams() {
  const standardCategories = ['Ai', 'Crypto', 'Tech', 'Data', 'Startups', 'Business', 'Markets', 'Product', 'Security', 'Policy', 'Science', 'Media']
  
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
  
  // Fetch articles for this category and all categories
  const [articles, allCategories] = await Promise.all([
    fetchArticles({ category: decodedCategory, search }),
    getArticleCategories()
  ])
  
  // Check if category exists
  if (!allCategories.includes(decodedCategory)) {
    notFound()
  }
  
  // Get related categories (similar or commonly paired categories)
  const relatedCategories = allCategories
    .filter(cat => cat !== decodedCategory)
    .slice(0, 8)
  
  // Generate JSON-LD structured data for category page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${decodedCategory} Articles from X`,
    "description": `Curated X articles about ${decodedCategory}`,
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
            <Link href="/new" className="hover:text-foreground transition-colors">
              Articles
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{decodedCategory}</span>
          </nav>
          
          {/* Page Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {decodedCategory} Articles from X
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
                initialCategories={allCategories}
                initialCategory={decodedCategory}
                initialSearchQuery={search || ''}
              />
            </Suspense>
          </div>
          
          {/* Related Categories */}
          {relatedCategories.length > 0 && (
            <div className="mt-12 space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground border-b border-border pb-2">
                Related Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {relatedCategories.map((cat) => (
                  <Link 
                    key={cat} 
                    href={`/category/${encodeURIComponent(cat)}`}
                    className="p-3 bg-primary/10 text-primary rounded-lg text-center hover:bg-primary/20 transition-colors block"
                  >
                    <span className="text-sm font-medium">{cat}</span>
                  </Link>
                ))}
              </div>
              
              {/* Link back to main categories */}
              <div className="text-center mt-8">
                <Link 
                  href="/new" 
                  className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Browse All Categories
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}