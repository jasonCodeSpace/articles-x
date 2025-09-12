import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { extractArticleIdFromSlug } from '@/lib/url-utils'

interface LegacyArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

/**
 * Legacy article page that redirects to new date-based URL structure
 * Handles old URLs like /article/{slug} and redirects to /{lang}/article/{YYYY}/{MM}/{DD}/{slug}
 */
export default async function LegacyArticlePage({ params }: LegacyArticlePageProps) {
  const resolvedParams = await params
  const { slug } = resolvedParams
  
  // Extract article ID from slug
  const articleId = extractArticleIdFromSlug(slug)
  
  if (!articleId) {
    redirect('/404')
  }
  
  const supabase = await createClient()
  
  // Find the article to get its published date
  const { data: articles } = await supabase
    .from('articles')
    .select('id, article_published_at, slug')
    .ilike('id', `%${articleId}%`)
    .limit(5)
  
  const article = articles?.find((a) => 
    a.id.replace(/-/g, '').toLowerCase().startsWith(articleId.toLowerCase())
  )
  
  if (!article || !article.article_published_at) {
    redirect('/404')
  }
  
  // Parse the published date
  const publishedAt = new Date(article.article_published_at)
  const year = publishedAt.getUTCFullYear().toString()
  const month = (publishedAt.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = publishedAt.getUTCDate().toString().padStart(2, '0')
  
  // Default to English for legacy URLs
  const lang = 'en'
  
  // Construct new URL with date structure
  const newUrl = `/${lang}/article/${year}/${month}/${day}/${slug}`
  
  // Permanent redirect (301)
  redirect(newUrl)
}

// Generate metadata for SEO
export async function generateMetadata() {
  return {
    robots: {
      index: false,
      follow: false,
    },
  }
}