import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ArticleContent } from '@/components/article-content'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'

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

function getLocaleFromLang(lang: string): string {
  const localeMap: Record<string, string> = {
    'en': 'en_US',
    'zh': 'zh_CN',
    'ja': 'ja_JP',
    'ko': 'ko_KR',
    'es': 'es_ES',
    'fr': 'fr_FR',
    'de': 'de_DE',
    'it': 'it_IT',
    'pt': 'pt_PT',
    'ru': 'ru_RU',
    'ar': 'ar_SA',
    'hi': 'hi_IN',
    'th': 'th_TH',
    'vi': 'vi_VN',
    'tr': 'tr_TR',
    'pl': 'pl_PL',
    'nl': 'nl_NL'
  }
  return localeMap[lang] || 'en_US'
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { lang, year, month, day, slug } = await params
  
  console.log('Article page params:', { lang, year, month, day, slug })
  
  // Validate language - support all languages detected by AI system
  const supportedLanguages = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl']
  if (!supportedLanguages.includes(lang)) {
    console.log('Language validation failed:', lang)
    notFound()
  }
  
  // Validate date
  if (!isValidDate(year, month, day)) {
    console.log('Date validation failed:', { year, month, day })
    notFound()
  }
  
  // Validate slug format
  if (!isValidArticleSlug(slug)) {
    console.log('Slug validation failed:', slug)
    notFound()
  }
  
  console.log('All validations passed')
  
  const supabase = await createClient()
  // Create service client for article queries (bypasses RLS)
  const serviceSupabase = createServiceClient()
  
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
  
  // Search for article by slug
  let { data: articles, error } = await serviceSupabase
    .from('articles')
    .select(`
      id,
      title,
      title_english,
      slug,
      article_published_at,
      author_name,
      category,
      article_url,
      full_article_content,
      summary_english,
      summary_chinese,
      summary_generated_at,
      language,
      image,
      author_handle,
      author_avatar
    `)
    .eq('slug', slug)
    .limit(1)
  
  if (error) {
    console.error('Supabase error:', error)
  }
  
  // If no exact match found, try to find by ID suffix and date (for truncated slugs)
  if (!articles || articles.length === 0) {
    console.log('No exact slug match found, trying fallback search...')
    
    // Extract the ID part from the slug (last 6 characters after --)
    const slugParts = slug.split('--')
    if (slugParts.length === 2 && slugParts[1].length === 6) {
      const idSuffix = slugParts[1]
      
      // Search for articles with matching ID suffix and published on the same date
      // Use UTC to avoid timezone issues
      const startOfDay = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0))
      const endOfDay = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999))
      
      const fallbackResult = await serviceSupabase
        .from('articles')
        .select(`
          id,
          title,
          title_english,
          slug,
          article_published_at,
          author_name,
          category,
          article_url,
          full_article_content,
          summary_english,
          summary_chinese,
          summary_generated_at,
          language,
          image,
          author_handle,
          author_avatar
        `)
        .like('slug', `%--${idSuffix}`)
        .gte('article_published_at', startOfDay.toISOString())
        .lte('article_published_at', endOfDay.toISOString())
        .limit(1)
      

      
      if (fallbackResult.error) {
        console.error('Fallback search error:', fallbackResult.error)
      }
      
      if (fallbackResult.data && fallbackResult.data.length > 0) {
        console.log('Found article via fallback search, redirecting to correct URL...')
        const correctArticle = fallbackResult.data[0]
        const publishedDate = new Date(correctArticle.article_published_at)
        const correctYear = publishedDate.getUTCFullYear().toString()
        const correctMonth = String(publishedDate.getUTCMonth() + 1).padStart(2, '0')
        const correctDay = String(publishedDate.getUTCDate()).padStart(2, '0')
        const correctUrl = `/${lang}/article/${correctYear}/${correctMonth}/${correctDay}/${correctArticle.slug}`
        redirect(correctUrl)
      } else {
        // Reassign articles to use fallback result for further processing
        articles = fallbackResult.data
        error = fallbackResult.error
      }
    }
    
    notFound()
  }
  
  const article = articles[0]
  
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
  
  // Verify the language code matches the article's language
  if (article.language && article.language !== lang) {
    console.log(`Language mismatch: URL has '${lang}' but article is '${article.language}', redirecting...`)
    const correctUrl = `/${article.language}/article/${expectedYear}/${expectedMonth}/${expectedDay}/${slug}`
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
  const title = article.title
  const description = ''
  
  const content = ''
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
    "dateModified": article.article_published_at,
    "author": {
      "@type": "Person",
      "name": article.author_name || "Unknown Author",
      "url": undefined
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
    "image": undefined,
    "keywords": article.category,
    "articleSection": article.category,
    "inLanguage": lang === 'zh' ? 'zh-CN' : lang === 'it' ? 'it-IT' : 'en-US',
    "isAccessibleForFree": true,
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": 0
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ShareAction",
        "userInteractionCount": 0
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/CommentAction",
        "userInteractionCount": 0
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
            article={{
              ...article,
              updated_at: article.article_published_at,
              author_handle: 'xarticle',
              author_avatar: undefined,
              image: undefined
            }}
            authorInitials={authorInitials}
            authorHandle={'xarticle'}
            avatarUrl={''}
            coverUrl={''}
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
  
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, title_english, excerpt, description, author_name, article_published_at, article_url')
    .eq('slug', slug)
    .limit(1)
  
  if (!articles || articles.length === 0) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.'
    }
  }
  
  const article = articles[0]
  const title = lang === 'zh' ? article.title : (article.title_english || article.title)
  const description = lang === 'zh' ? (article.description || article.excerpt) : (article.excerpt || article.description)
  
  // Determine canonical URL - prefer original article URL if available
  const baseUrl = 'https://www.xarticle.news'
  const publishedDate = new Date(article.article_published_at)
  const pubYear = publishedDate.getUTCFullYear().toString()
  const pubMonth = String(publishedDate.getUTCMonth() + 1).padStart(2, '0')
  const pubDay = String(publishedDate.getUTCDate()).padStart(2, '0')
  const currentUrl = `${baseUrl}/${lang}/article/${pubYear}/${pubMonth}/${pubDay}/${slug}`
  
  const canonicalUrl = article.article_url && article.article_url.startsWith('http') 
    ? article.article_url 
    : currentUrl

  // Generate hreflang URLs for all supported languages
  const supportedLanguages = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl']
  const languageUrls = Object.fromEntries(
    supportedLanguages.map(langCode => [
      langCode,
      `${baseUrl}/${langCode}/article/${pubYear}/${pubMonth}/${pubDay}/${slug}`
    ])
  )

  return {
    title: `${title} | XArticle`,
    description: description || `Read ${title} on XArticle`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...languageUrls,
        'x-default': languageUrls.en
      }
    },
    openGraph: {
      title,
      description: description || `Read ${title} on XArticle`,
      type: 'article',
      publishedTime: article.article_published_at,
      authors: [article.author_name || 'Unknown'],
      url: canonicalUrl,
      locale: getLocaleFromLang(lang),
      alternateLocale: supportedLanguages.filter(l => l !== lang).map(getLocaleFromLang)
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