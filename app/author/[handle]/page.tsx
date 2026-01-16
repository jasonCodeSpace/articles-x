import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ModernNav } from '@/components/modern-nav'
import { AuthorArticlesClient } from '@/components/author-articles-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface AuthorPageProps {
  params: Promise<{
    handle: string
  }>
}

async function getAuthorData(handle: string, page: number = 1, limit: number = 9) {
  const supabase = createServiceClient()
  const offset = (page - 1) * limit

  // Get total count
  const { count: totalCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('author_handle', handle)

  // Fetch articles
  const { data: articlesData, error } = await supabase
    .from('articles')
    .select(
      'id, title, article_preview_text, image, author_name, author_handle, author_avatar, article_published_at, tweet_id, language, category, slug, tweet_likes, tweet_retweets, tweet_replies'
    )
    .eq('author_handle', handle)
    .order('article_published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !articlesData || articlesData.length === 0) {
    return null
  }

  const firstArticle = articlesData[0]
  const authorInfo = {
    username: firstArticle.author_handle,
    full_name: firstArticle.author_name,
    avatar_url: firstArticle.author_avatar,
    articleCount: totalCount || articlesData.length
  }

  const articles = articlesData.map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    author_name: article.author_name,
    author_handle: article.author_handle,
    author_avatar: article.author_avatar,
    image: article.image,
    article_published_at: article.article_published_at,
    created_at: article.article_published_at,
    tags: [],
    category: article.category,
    tweet_id: article.tweet_id,
    tweet_views: 0,
    tweet_replies: article.tweet_replies || 0,
    tweet_retweets: article.tweet_retweets || 0,
    tweet_likes: article.tweet_likes || 0,
    tweet_bookmarks: 0,
    article_preview_text: article.article_preview_text,
    language: article.language
  }))

  const totalPages = Math.ceil((totalCount || 0) / limit)

  return {
    authorInfo,
    articles,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount: totalCount || 0,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  }
}

async function getCategories() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null)

  if (!data) return []

  const categorySet = new Set<string>()
  data.forEach((item) => {
    if (item.category) {
      item.category.split(',').forEach((cat: string) => {
        categorySet.add(cat.trim())
      })
    }
  })

  return Array.from(categorySet).sort()
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { handle } = await params
  const data = await getAuthorData(handle)

  if (!data) {
    return {
      title: 'Author Not Found | XArticle',
      description: 'The requested author could not be found.'
    }
  }

  const { authorInfo } = data
  const title = `${authorInfo.full_name} (@${authorInfo.username}) | XArticle`
  const description = `Read ${authorInfo.articleCount} articles by ${authorInfo.full_name} on XArticle. Discover insights and perspectives from @${authorInfo.username}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: authorInfo.avatar_url ? [{
        url: authorInfo.avatar_url,
        width: 400,
        height: 400,
        alt: `${authorInfo.full_name} profile picture`
      }] : undefined
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: authorInfo.avatar_url ? [authorInfo.avatar_url] : undefined
    },
    alternates: {
      canonical: `https://www.xarticle.news/author/${handle}`
    }
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { handle } = await params
  const [data, categories] = await Promise.all([
    getAuthorData(handle),
    getCategories()
  ])

  if (!data) {
    notFound()
  }

  const { authorInfo, articles, pagination } = data

  const authorInitials = (authorInfo.full_name || '')
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Person Schema for SEO
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": authorInfo.full_name,
    "url": `https://x.com/${authorInfo.username}`,
    "image": authorInfo.avatar_url,
    "sameAs": [
      `https://x.com/${authorInfo.username}`
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <div className="min-h-screen bg-background">
        <ModernNav categories={categories} />
        <div className="container mx-auto px-4 py-8 pt-24">
          <Link
            href="/trending"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-gray-600">
                {authorInfo.avatar_url ? (
                  <AvatarImage
                    src={authorInfo.avatar_url}
                    alt={`${authorInfo.full_name} profile picture`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="text-lg font-medium bg-gray-600 text-white">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{authorInfo.full_name}</h1>
                <p className="text-gray-400 mb-2">@{authorInfo.username}</p>
                <p className="text-sm text-gray-500">
                  {authorInfo.articleCount} {authorInfo.articleCount === 1 ? 'article' : 'articles'}
                </p>
              </div>
            </div>
          </div>

          <AuthorArticlesClient
            handle={handle}
            initialArticles={articles}
            initialPagination={pagination}
          />
        </div>
      </div>
    </>
  )
}

export const revalidate = 3600
