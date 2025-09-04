import { notFound } from 'next/navigation'
import { ModernNav } from '@/components/modern-nav'
import { ArticleContent } from '@/components/article-content'

import { ArticleBreadcrumb } from '@/components/article-breadcrumb'
import { LanguageProvider } from '@/contexts/language-context'
import { createClient } from '@/lib/supabase/server'
import { extractArticleIdFromSlug } from '@/lib/url-utils'
import { formatDistanceToNow } from '@/lib/date-utils'

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

// Function to validate article slug format
function isValidArticleSlug(slug: string): boolean {
  // Check if slug follows the correct format: title-with-hyphens--shortId
  const parts = slug.split('--')
  if (parts.length !== 2) {
    return false
  }
  
  const titlePart = parts[0]
  const idPart = parts[1]
  
  // Title part should be properly formatted with hyphens separating words
  // Reject slugs that are too long without proper word separation
  if (titlePart.length > 100) {
    return false
  }
  
  // Title part should not contain very long sequences without hyphens (indicating poor formatting)
  const words = titlePart.split('-')
  const hasLongWord = words.some(word => word.length > 15)
  if (hasLongWord) {
    return false
  }
  
  // ID part should be exactly 6 characters (hex)
  if (idPart.length !== 6 || !/^[a-f0-9]{6}$/i.test(idPart)) {
    return false
  }
  
  return true
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params
  const supabase = await createClient()
  
  // Validate slug format first
  if (!isValidArticleSlug(resolvedParams.slug)) {
    notFound()
  }
  
  // Get user session
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch categories
  let categories: string[] = [];
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      const uniqueCategories = new Set<string>();
      data?.forEach(article => {
        if (article.category) {
          // Split comma-separated categories and add all of them
          article.category.split(',').forEach((cat: string) => {
            const trimmedCat = cat.trim();
            if (trimmedCat) {
              uniqueCategories.add(trimmedCat);
            }
          });
        }
      });
      categories = Array.from(uniqueCategories).sort();
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
  
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

  const articleUrl = `https://www.xarticle.news/article/${resolvedParams.slug}`
  
  return {
    title: article.title_english || article.title,
    description: article.article_preview_text_english || article.article_preview_text || 'Read this article',
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: article.title_english || article.title,
      description: article.article_preview_text_english || article.article_preview_text || 'Read this article',
      type: 'article',
      url: articleUrl,
      siteName: 'Articles X',
      images: article.image ? [{ 
        url: article.image,
        width: 1200,
        height: 630,
        alt: article.title_english || article.title
      }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@xarticle_news',
      title: article.title_english || article.title,
      description: article.article_preview_text_english || article.article_preview_text || 'Read this article',
      images: article.image ? [{
        url: article.image,
        alt: article.title_english || article.title
      }] : [],
    },
  }
}