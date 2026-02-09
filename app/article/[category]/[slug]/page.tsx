import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import { getArticleBySlug, getPreviousArticle, getNextArticle, fetchArticles, getArticleCategoriesById, findArchivePageForArticle } from '@/lib/articles'
import { categorySlugToId, getCategoryName } from '@/lib/categories'
import { categoryIdToSlug } from '@/lib/url-utils'
import { ArticleContent } from '@/components/article-content'
import { ArticleNavigation } from '@/components/article-navigation'
import dynamic from 'next/dynamic'

// Lazy load non-critical components
const ArticleComments = dynamic(() => import('@/components/comments').then(mod => ({ default: mod.ArticleComments })), {
  loading: () => <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
})

const ScrollToTopButton = dynamic(() => import('@/components/scroll-to-top-button').then(mod => ({ default: mod.ScrollToTopButton })))

interface ArticlePageProps {
  params: Promise<{
    category: string
    slug: string
  }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug, category } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.'
    }
  }

  const title = article.title_english || article.title

  // Get first sentence from summary_english for description
  const summary = article.summary_english || ''
  const firstSentence = summary.split(/[.!?]/)[0]
  const description = firstSentence.length > 160
    ? firstSentence.substring(0, 160) + '...'
    : firstSentence

  // Get the article's primary category from the junction table
  // This ensures all category variants point to the same canonical URL
  const articleCategories = await getArticleCategoriesById(article.id)
  const primaryCategoryId = articleCategories.length > 0 ? articleCategories[0] : categorySlugToId(category)
  const primaryCategorySlug = categoryIdToSlug(primaryCategoryId)

  // Always use the primary category for canonical URL to avoid duplicate content
  const canonicalUrl = `https://www.xarticle.news/article/${primaryCategorySlug}/${slug}`

  // Check if current URL is the canonical one
  const currentCategoryId = categorySlugToId(category)
  const isCanonicalUrl = currentCategoryId === primaryCategoryId

  return {
    title: `${title} | XArticle`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'x-default': canonicalUrl,
        'en': canonicalUrl,
      }
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.article_published_at || article.updated_at,
      authors: [article.author_name],
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    // Only index the canonical URL, not category variants
    robots: isCanonicalUrl ? { index: true, follow: true } : { index: false, follow: true },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug, category } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  // If article is not indexed, redirect to archive page with the article's page
  if (article.indexed === false) {
    const archivePage = await findArchivePageForArticle(article.id)
    if (archivePage) {
      return permanentRedirect(`/archive?page=${archivePage}`)
    }
    // Fallback to archive page 1 if page calculation fails
    return permanentRedirect('/archive')
  }

  // Get the article's categories to validate the URL
  const articleCategories = await getArticleCategoriesById(article.id)
  const categoryId = categorySlugToId(category)

  // If the category in URL doesn't match the article's categories, redirect to the primary category
  // Use articleCategories[0] as the primary category (from junction table, is_primary=true)
  if (articleCategories.length > 0 && !articleCategories.includes(categoryId)) {
    const primaryCategorySlug = articleCategories[0].replace(':', '-')
    return permanentRedirect(`/article/${primaryCategorySlug}/${slug}`)
  }

  // Get previous and next articles, and more articles
  const [previousArticle, nextArticle, moreArticles] = await Promise.all([
    getPreviousArticle(article.id),
    getNextArticle(article.id),
    fetchArticles({ limit: 6, sort: 'newest' })
  ])

  // Get first sentence from summary_english for description
  const summary = article.summary_english || ''
  const firstSentence = summary.split(/[.!?]/)[0]
  const description = firstSentence.length > 160
    ? firstSentence.substring(0, 160) + '...'
    : firstSentence

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

  // Get category name for display
  const categoryName = getCategoryName(categoryId) || categoryId

  // Simplified structured data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title_english || article.title,
    "datePublished": article.article_published_at || article.updated_at,
    "author": {
      "@type": "Person",
      "name": article.author_name
    },
    "publisher": {
      "@type": "Organization",
      "name": "Xarticle"
    },
    "description": description
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20">
        <div className="max-w-3xl mx-auto px-6 pt-24 pb-20">
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
          <div className="mt-8 pt-6">
            <ArticleNavigation
              previousArticle={previousArticle}
              nextArticle={nextArticle}
            />
          </div>

          {/* Comments Section */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <ArticleComments articleId={article.id} />
          </div>

          {/* More Articles Section */}
          {moreArticles.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm uppercase tracking-wider font-bold text-white/30">
                  More Articles
                </h3>
                <Link
                  href="/trending"
                  className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {moreArticles
                  .filter(a => a.id !== article.id)
                  .slice(0, 4)
                  .map((moreArticle) => {
                    const displayTitle = moreArticle.title_english || moreArticle.title
                    const categorySlug = moreArticle.category ? categoryIdToSlug(moreArticle.category) : 'tech'
                    return (
                      <Link
                        key={moreArticle.id}
                        href={`/article/${categorySlug}/${moreArticle.slug}`}
                        className="group flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-colors"
                      >
                        {moreArticle.image && (
                          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/5">
                            <Image
                              src={moreArticle.image}
                              alt={displayTitle}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors line-clamp-2">
                            {displayTitle}
                          </h4>
                          {moreArticle.author_handle && (
                            <div className="text-[10px] text-white/30 mt-1">
                              @{moreArticle.author_handle}
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        <ScrollToTopButton />
      </div>
    </>
  )
}

// Use ISR with 5-minute revalidation for article pages
export const revalidate = 300
