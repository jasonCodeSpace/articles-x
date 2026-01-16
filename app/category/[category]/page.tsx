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

// SEO-optimized category descriptions
const categoryDescriptions: Record<string, { title: string; description: string }> = {
  'ai': {
    title: 'AI & Machine Learning Articles',
    description: 'Latest AI breakthroughs, machine learning insights, and artificial intelligence trends from industry experts on X.'
  },
  'crypto': {
    title: 'Crypto & Blockchain Articles',
    description: 'DeFi protocols, blockchain technology, and cryptocurrency market analysis from top voices on X.'
  },
  'tech': {
    title: 'Technology & Software Articles',
    description: 'Software engineering, cloud architecture, and tech industry insights from developers on X.'
  },
  'startups': {
    title: 'Startup & Entrepreneurship Articles',
    description: 'Founder stories, fundraising strategies, and startup growth insights from entrepreneurs on X.'
  },
  'business': {
    title: 'Business Strategy Articles',
    description: 'Business operations, monetization strategies, and management insights from industry leaders on X.'
  },
  'markets': {
    title: 'Financial Markets Articles',
    description: 'Stock market analysis, macro economics, and trading insights from financial experts on X.'
  },
  'product': {
    title: 'Product Management Articles',
    description: 'Product strategy, user research, and roadmap planning insights from product leaders on X.'
  },
  'design': {
    title: 'Design & UX Articles',
    description: 'UI/UX design, visual design, and design system insights from creative professionals on X.'
  },
  'security': {
    title: 'Cybersecurity Articles',
    description: 'Security research, privacy engineering, and threat analysis from security experts on X.'
  },
  'data': {
    title: 'Data Engineering Articles',
    description: 'Data pipelines, analytics, and MLOps insights from data professionals on X.'
  },
  'hardware': {
    title: 'Hardware & Electronics Articles',
    description: 'Semiconductor innovations, computer hardware, and electronics engineering insights from hardware experts on X.'
  },
  'gaming': {
    title: 'Gaming Industry Articles',
    description: 'Video game development, esports, and gaming industry trends from game developers and enthusiasts on X.'
  },
  'health': {
    title: 'Health & Wellness Articles',
    description: 'Medical research, health technology, and wellness insights from healthcare professionals on X.'
  },
  'environment': {
    title: 'Environment & Climate Articles',
    description: 'Climate science, sustainability initiatives, and environmental policy discussions from experts on X.'
  },
  'personal-story': {
    title: 'Personal Stories & Experiences',
    description: 'Inspiring personal journeys, career stories, and life lessons shared by thought leaders on X.'
  },
  'culture': {
    title: 'Culture & Society Articles',
    description: 'Cultural trends, social commentary, and societal observations from diverse voices on X.'
  },
  'philosophy': {
    title: 'Philosophy & Ideas Articles',
    description: 'Philosophical discussions, intellectual debates, and thought-provoking ideas from thinkers on X.'
  },
  'history': {
    title: 'History & Heritage Articles',
    description: 'Historical analysis, heritage preservation, and lessons from the past shared by historians on X.'
  },
  'education': {
    title: 'Education & Learning Articles',
    description: 'EdTech innovations, learning strategies, and educational insights from educators on X.'
  },
  'marketing': {
    title: 'Marketing & Growth Articles',
    description: 'Digital marketing strategies, growth hacking, and brand building insights from marketers on X.'
  },
  'policy': {
    title: 'Policy & Regulation Articles',
    description: 'Tech policy, regulatory developments, and governance discussions from policy experts on X.'
  },
  'science': {
    title: 'Science & Research Articles',
    description: 'Scientific discoveries, research breakthroughs, and academic insights from scientists on X.'
  },
  'media': {
    title: 'Media & Journalism Articles',
    description: 'Media trends, journalism practices, and content creation insights from media professionals on X.'
  },
}

// Generate metadata for category pages
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const decodedCategory = categorySlugToDisplayName(category)
  const slug = category.toLowerCase()

  // Use optimized description if available
  const seoData = categoryDescriptions[slug]
  const title = seoData?.title || `${decodedCategory} Articles on X`
  const description = seoData?.description ||
    `Discover daily curated ${decodedCategory.toLowerCase()} articles shared on X—expert insights and must-read posts.`

  return {
    title: `${title} | Xarticle.news`,
    description,
    alternates: { canonical: `/category/${slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      url: `/category/${slug}`,
      title: `${title} | Xarticle.news`,
      description,
    },
    twitter: {
      card: 'summary',
      title,
      description,
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
    // Fetch articles for this category
    const allArticles = await fetchArticles({ category: decodedCategory, search })
    
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