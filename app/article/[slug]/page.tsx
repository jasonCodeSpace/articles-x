import { notFound } from 'next/navigation'
import { ModernNav } from '@/components/modern-nav'
import { ArticleContent } from '@/components/article-content'

import { ArticleBreadcrumb } from '@/components/article-breadcrumb'
import { LanguageProvider } from '@/contexts/language-context'
import { createClient } from '@/lib/supabase/server'
import { extractArticleIdFromSlug } from '@/lib/url-utils'
import { formatDistanceToNow } from 'date-fns'

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params
  const supabase = await createClient()
  
  // Get user session
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get categories
  const { data: categoriesData } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null)
  
  const categories = [...new Set(categoriesData?.map(item => item.category) || [])]
  
  // Extract short ID from the slug and find the full UUID
  const shortId = extractArticleIdFromSlug(resolvedParams.slug)
  // Use SQL to directly find the article by short ID pattern
  // Convert UUID to text and remove dashes, then check if it starts with shortId
  const { data: articles, error: searchError } = await supabase
    .rpc('find_articles_by_short_id', { short_id: shortId })
  
  if (searchError) {
    console.error('Database error:', searchError)
    notFound()
  }
  
  // The RPC function already filters by short ID, so we just need the first result
  const article = articles?.[0]
  
  if (!article) {
    notFound()
  }

  const authorInitials = article.author_name
    ?.split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'A'

  const publishedDate = article.article_published_at || article.updated_at
  const relativeTime = publishedDate ? formatDistanceToNow(new Date(publishedDate), { addSuffix: true }) : ''

  const authorHandle = article.author_handle || 
    article.author_name?.toLowerCase().replace(/\s+/g, '_') || 'unknown'

  const avatarUrl = article.author_avatar
  const coverUrl = article.image

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background">
        {/* Modern Navigation */}
        <ModernNav user={user ?? undefined} categories={categories} />
        
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          {/* Breadcrumbs */}
          <ArticleBreadcrumb article={article} />



          {/* Article Content */}
          <ArticleContent
            article={article}
            authorInitials={authorInitials}
            authorHandle={authorHandle}
            avatarUrl={avatarUrl}
            coverUrl={coverUrl}
            publishedDate={publishedDate}
            relativeTime={relativeTime}
          />
        </div>
      </div>
    </LanguageProvider>
  )
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const resolvedParams = await params
  const supabase = await createClient()
  
  // Extract short ID from the slug and find the full UUID
  const shortId = extractArticleIdFromSlug(resolvedParams.slug)
  
  // Use the same RPC function as the main component
  const { data: articles, error: searchError } = await supabase
    .rpc('find_articles_by_short_id', { short_id: shortId })
  
  if (searchError || !articles) {
    return {
      title: 'Article Not Found'
    }
  }
  
  // The RPC function already filters by short ID, so we just need the first result
  const article = articles?.[0]

  if (!article) {
    return {
      title: 'Article Not Found'
    }
  }

  return {
    title: article.title_english || article.title,
    description: article.article_preview_text_english || article.article_preview_text || 'Read this article',
    alternates: {
      canonical: article.article_url, // Point to original X URL as canonical source
    },
    openGraph: {
      title: article.title_english || article.title,
      description: article.article_preview_text_english || article.article_preview_text || 'Read this article',
      images: article.image ? [{ url: article.image }] : [],
      url: article.article_url, // Original X URL
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title_english || article.title,
      description: article.article_preview_text_english || article.article_preview_text || 'Read this article',
      images: article.image ? [article.image] : [],
    },
  }
}