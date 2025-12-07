import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticleBySlug, getPreviousArticle, getNextArticle } from '@/lib/articles'
import { ArticleContent } from '@/components/article-content'
import { ArticleNavigation } from '@/components/article-navigation'

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

  // Get previous and next articles
  const [previousArticle, nextArticle] = await Promise.all([
    getPreviousArticle(article.id),
    getNextArticle(article.id)
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
      <ArticleNavigation
        previousArticle={previousArticle}
        nextArticle={nextArticle}
      />
    </div>
  )
}

export async function generateStaticParams() {
  return []
}

export const revalidate = 3600
export const dynamic = 'force-dynamic'