import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArticleContent } from '@/components/article-content'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { extractArticleIdFromSlug } from '@/lib/url-utils'

interface ArticlePageProps {
  params: Promise<{
    lang: string
    year: string
    month: string
    day: string
    slug: string
  }>
}

/**
 * Validate if the slug format is correct
 */
function isValidArticleSlug(slug: string): boolean {
  // Check if slug ends with --{6 hex chars}
  const pattern = /^.+--[a-f0-9]{6}$/i
  if (!pattern.test(slug)) {
    return false
  }
  
  // Check if title part is not empty or placeholder
  const titlePart = slug.split('--')[0]
  return Boolean(titlePart) && titlePart.length > 2 && !titlePart.startsWith('article')
}

/**
 * Validate date parameters
 */
function isValidDate(year: string, month: string, day: string): boolean {
  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)
  const dayNum = parseInt(day, 10)
  
  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
    return false
  }
  
  if (yearNum < 2020 || yearNum > new Date().getFullYear() + 1) {
    return false
  }
  
  if (monthNum < 1 || monthNum > 12) {
    return false
  }
  
  // Check if the date is valid
  const date = new Date(yearNum, monthNum - 1, dayNum)
  return date.getFullYear() === yearNum && 
         date.getMonth() === monthNum - 1 && 
         date.getDate() === dayNum
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { lang, year, month, day, slug } = await params
  
  // Validate language
  if (!['en', 'zh'].includes(lang)) {
    notFound()
  }
  
  // Validate date
  if (!isValidDate(year, month, day)) {
    notFound()
  }
  
  // Validate slug format
  if (!isValidArticleSlug(slug)) {
    notFound()
  }
  
  const supabase = await createClient()
  
  // Get user session
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get categories for navigation
  const { data: categoriesData } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null)
  
  const categories = [...new Set(
    categoriesData?.flatMap(item => 
      item.category ? item.category.split(',').map((cat: string) => cat.trim()).filter(Boolean) : []
    ) || []
  )]
  
  // Extract article ID from slug
  const articleId = extractArticleIdFromSlug(slug)
  
  // Search for article by short ID
  const { data: articles } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      title_english,
      content,
      content_english,
      summary,
      summary_english,
      slug,
      article_published_at,
      updated_at,
      author_name,
      author_handle,
      author_profile_image_url,
      category,
      tags,
      url,
      retweet_count,
      like_count,
      reply_count,
      quote_count,
      bookmark_count,
      impression_count,
      author_avatar,
      image
    `)
    .ilike('id', `%${articleId}%`)
    .limit(5)
  
  if (!articles || articles.length === 0) {
    notFound()
  }
  
  // Find exact match by checking if the full ID starts with our short ID
  const article = articles.find((a) => a.id.replace(/-/g, '').toLowerCase().startsWith(articleId.toLowerCase()))
  
  if (!article) {
    notFound()
  }
  
  // Verify the article was published on the specified date
  const publishedDate = new Date(article.article_published_at)
  const expectedYear = publishedDate.getUTCFullYear().toString()
  const expectedMonth = String(publishedDate.getUTCMonth() + 1).padStart(2, '0')
  const expectedDay = String(publishedDate.getUTCDate()).padStart(2, '0')
  
  if (year !== expectedYear || month !== expectedMonth || day !== expectedDay) {
    // Redirect to correct date URL
    const correctUrl = `/${lang}/article/${expectedYear}/${expectedMonth}/${expectedDay}/${slug}`
    redirect(correctUrl)
  }
  
  // Calculate author initials
  const authorInitials = article.author_name
    ?.split(' ')
    .map((name: string) => name.charAt(0))
    .join('')
    .toUpperCase() || '??'
  
  // Format published date
  const publishedAt = new Date(article.article_published_at)
  const relativeTime = new Intl.RelativeTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', { numeric: 'auto' })
  const daysDiff = Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24))
  const timeAgo = relativeTime.format(-daysDiff, 'day')
  
  // Generate structured data for SEO
  const title = lang === 'zh' ? article.title : (article.title_english || article.title)
  const description = lang === 'zh' ? article.summary : (article.summary_english || article.summary)
  const content = lang === 'zh' ? article.content : (article.content_english || article.content)
  const baseUrl = 'https://www.xarticle.news'
  const currentUrl = `${baseUrl}/${lang}/article/${year}/${month}/${day}/${slug}`
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "articleBody": content,
    "url": currentUrl,
    "datePublished": article.article_published_at,
    "dateModified": article.updated_at || article.article_published_at,
    "author": {
      "@type": "Person",
      "name": article.author_name || "Unknown Author",
      "url": article.author_handle ? `https://x.com/${article.author_handle}` : undefined
    },
    "publisher": {
      "@type": "Organization",
      "name": "Xarticle",
      "url": "https://www.xarticle.news",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.xarticle.news/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": currentUrl
    },
    "image": article.image ? {
      "@type": "ImageObject",
      "url": article.image
    } : undefined,
    "keywords": article.tags || article.category,
    "articleSection": article.category,
    "inLanguage": lang === 'zh' ? 'zh-CN' : 'en-US',
    "isAccessibleForFree": true,
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": article.like_count || 0
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ShareAction",
        "userInteractionCount": article.retweet_count || 0
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/CommentAction",
        "userInteractionCount": article.reply_count || 0
      }
    ]
  }
  
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <ClientNavWrapper initialUser={user} categories={categories} />
      
      <div className="pt-20 md:pt-16 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ArticleContent 
            article={article}
            authorInitials={authorInitials}
            authorHandle={article.author_handle || 'unknown'}
            avatarUrl={article.author_avatar || ''}
            coverUrl={article.image || ''}
            publishedDate={publishedAt.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            relativeTime={timeAgo}
          />
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { lang, slug } = await params
  
  if (!isValidArticleSlug(slug)) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.'
    }
  }
  
  const supabase = await createClient()
  const articleId = extractArticleIdFromSlug(slug)
  
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, title_english, summary, summary_english, author_name, article_published_at, article_url')
    .ilike('id', `%${articleId}%`)
    .limit(5)
  
  const article = articles?.find((a) => a.id.replace(/-/g, '').toLowerCase().startsWith(articleId.toLowerCase()))
  
  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.'
    }
  }
  
  const title = lang === 'zh' ? article.title : (article.title_english || article.title)
  const description = lang === 'zh' ? article.summary : (article.summary_english || article.summary)
  
  // Determine canonical URL - prefer original article URL if available
  const baseUrl = 'https://www.xarticle.news'
  const publishedDate = new Date(article.article_published_at)
  const year = publishedDate.getUTCFullYear().toString()
  const month = String(publishedDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(publishedDate.getUTCDate()).padStart(2, '0')
  const currentUrl = `${baseUrl}/${lang}/article/${year}/${month}/${day}/${slug}`
  
  const canonicalUrl = article.article_url && article.article_url.startsWith('http') 
    ? article.article_url 
    : currentUrl

  // Generate hreflang URLs for both languages
  const enUrl = `${baseUrl}/en/article/${year}/${month}/${day}/${slug}`
  const zhUrl = `${baseUrl}/zh/article/${year}/${month}/${day}/${slug}`

  return {
    title: `${title} | XArticle`,
    description: description || `Read ${title} on XArticle`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': enUrl,
        'zh': zhUrl,
        'x-default': enUrl
      }
    },
    openGraph: {
      title,
      description: description || `Read ${title} on XArticle`,
      type: 'article',
      publishedTime: article.article_published_at,
      authors: [article.author_name || 'Unknown'],
      url: canonicalUrl,
      locale: lang === 'zh' ? 'zh_CN' : 'en_US',
      alternateLocale: lang === 'zh' ? 'en_US' : 'zh_CN'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || `Read ${title} on XArticle`,
    },
    robots: {
      index: !article.article_url || !article.article_url.startsWith('http'),
      follow: true
    }
  }
}