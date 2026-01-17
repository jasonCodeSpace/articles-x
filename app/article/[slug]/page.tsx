import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getArticleBySlug, getPreviousArticle, getNextArticle, getRelatedArticles } from '@/lib/articles'
import { ArticleContent } from '@/components/article-content'
import { ArticleNavigation } from '@/components/article-navigation'
import { RelatedArticles } from '@/components/related-articles'
import { ArticleComments } from '@/components/article-comments'
import { ScrollToTopButton } from '@/components/scroll-to-top-button'

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.'
    }
  }

  const title = article.title_english || article.title
  const description = article.summary_english || article.summary_chinese ||
    (article.full_article_content ? article.full_article_content.substring(0, 160) + '...' : '')

  return {
    title: `${title} | XArticle`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.article_published_at || article.updated_at,
      authors: [article.author_name],
      images: article.image ? [{
        url: article.image,
        width: 1200,
        height: 630,
        alt: title
      }] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.image ? [article.image] : undefined
    }
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  // Get previous and next articles, and related articles
  const [previousArticle, nextArticle, relatedArticles] = await Promise.all([
    getPreviousArticle(article.id),
    getNextArticle(article.id),
    getRelatedArticles(article.id, article.category || null, 2)
  ])

  // Generate author initials
  const authorInitials = article.author_name
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)

  // Generate author handle
  const authorHandle = article.author_handle ||
    article.author_name.toLowerCase().replace(/\s+/g, '')

  // Process dates
  const publishedDate = article.article_published_at || article.updated_at || new Date().toISOString()
  const publishedTime = new Date(publishedDate)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - publishedTime.getTime()) / (1000 * 60 * 60))

  let relativeTime: string
  if (diffInHours < 1) {
    relativeTime = 'less than an hour ago'
  } else if (diffInHours < 24) {
    relativeTime = `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      relativeTime = `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else if (diffInDays < 30) {
      const diffInWeeks = Math.floor(diffInDays / 7)
      relativeTime = `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    } else {
      const diffInMonths = Math.floor(diffInDays / 30)
      relativeTime = `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
    }
  }

  // JSON-LD structured data for SEO
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title_english || article.title,
    "datePublished": article.article_published_at || article.updated_at,
    "dateModified": article.updated_at,
    "author": {
      "@type": "Person",
      "name": article.author_name,
      "url": `https://x.com/${authorHandle}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "Xarticle",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.xarticle.news/logo.svg"
      }
    },
    "image": article.image || "https://www.xarticle.news/og-image.png",
    "description": (article.summary_english || article.summary_chinese || "")?.substring(0, 160),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.xarticle.news/article/${slug}`
    }
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.xarticle.news"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": article.category || "Articles",
        "item": article.category ? `https://www.xarticle.news/category/${article.category}` : "https://www.xarticle.news/trending"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title_english || article.title
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20">
        {/* Decorative background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px]" />
          <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-white/[0.02] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-20">
          {/* Back button */}
          <Link
            href="/trending"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Articles
          </Link>

          <ArticleContent
            article={{
              ...article,
              updated_at: article.updated_at || new Date().toISOString()
            }}
            authorInitials={authorInitials}
            authorHandle={authorHandle}
            avatarUrl={article.author_avatar}
            publishedDate={publishedDate}
            relativeTime={relativeTime}
          />

          {/* Previous/Next Navigation */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <ArticleNavigation
              previousArticle={previousArticle}
              nextArticle={nextArticle}
            />
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/5">
              <RelatedArticles articles={relatedArticles} />
            </div>
          )}

          {/* Comments Section - below related articles */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <ArticleComments articleId={article.id} />
          </div>
        </div>

        {/* Scroll to Top Button */}
        <ScrollToTopButton />
      </div>
    </>
  )
}

// Use ISR with 5-minute revalidation for article pages
export const revalidate = 300
export const dynamic = 'force-dynamic'
