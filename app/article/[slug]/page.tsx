import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, Eye, MessageCircle, Repeat2, Heart, Bookmark, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import AiSummary from '@/components/ai-summary'
import { extractArticleIdFromSlug } from '@/lib/url-utils'

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params
  const supabase = await createClient()
  
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
  
  // Find the exact match by comparing the short ID
  const article = articles?.find((a: any) => {
    const articleShortId = a.id.replace(/-/g, '').substring(0, 6)
    return articleShortId === shortId
  })
  
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/articles" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span>Articles</span>
            </Link>
            <span>/</span>
            <span className="text-white truncate">{article.title}</span>
          </div>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            {article.title}
          </h1>
          
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12">
              {avatarUrl ? (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={`${article.author_name} profile picture`}
                />
              ) : null}
              <AvatarFallback className="text-sm font-medium bg-gray-600 text-white">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-white">{article.author_name}</div>
              <div className="text-sm text-gray-400">@{authorHandle}</div>
            </div>
          </div>

          {/* Publication Date */}
          {publishedDate && (
            <div className="text-sm text-gray-400 mb-4">
              Published {relativeTime}
            </div>
          )}

          {/* Featured Image */}
          {coverUrl && (
            <div className="mb-6">
              <Image
                src={coverUrl}
                alt={`Cover for ${article.title}`}
                width={800}
                height={400}
                className="w-full h-64 md:h-96 object-cover rounded-lg border border-gray-700"
                loading="lazy"
                unoptimized
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Tweet engagement stats */}
          {(article.tweet_views || article.tweet_replies || article.tweet_retweets || article.tweet_likes || article.tweet_bookmarks) && (
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 p-4 bg-gray-900 rounded-lg">
              {article.tweet_views !== undefined && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.tweet_views.toLocaleString()} views</span>
                </div>
              )}
              {article.tweet_replies !== undefined && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{article.tweet_replies.toLocaleString()} replies</span>
                </div>
              )}
              {article.tweet_retweets !== undefined && (
                <div className="flex items-center gap-1">
                  <Repeat2 className="h-4 w-4" />
                  <span>{article.tweet_retweets.toLocaleString()} retweets</span>
                </div>
              )}
              {article.tweet_likes !== undefined && (
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{article.tweet_likes.toLocaleString()} likes</span>
                </div>
              )}
              {article.tweet_bookmarks !== undefined && (
                <div className="flex items-center gap-1">
                  <Bookmark className="h-4 w-4" />
                  <span>{article.tweet_bookmarks.toLocaleString()} bookmarks</span>
                </div>
              )}
            </div>
          )}

          {/* AI Summary Section */}
          {article.summary_english && (
            <AiSummary
              summaryEnglish={article.summary_english}
              summaryChinese={article.summary_chinese}
              summaryGeneratedAt={article.summary_generated_at}
            />
          )}
        </header>

        {/* Article Content */}
        <article className="prose prose-invert prose-lg max-w-none">
          {article.full_article_content ? (
            <div 
              className="whitespace-pre-wrap leading-relaxed text-gray-200"
              dangerouslySetInnerHTML={{ __html: article.full_article_content.replace(/\n/g, '<br />') }}
            />
          ) : (
            <div className="text-gray-400 italic">
              Full article content is not available.
            </div>
          )}
        </article>



        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Category */}
            {article.category && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Category:</span>
                <span className="inline-flex items-center rounded-full bg-gray-800 text-gray-300 border border-gray-700 px-3 py-1 text-sm">
                  {article.category}
                </span>
              </div>
            )}

            {/* Original Article Link */}
            {article.article_url && (
              <a
                href={article.article_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View original article</span>
              </a>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const resolvedParams = await params
  const supabase = await createClient()
  
  // Extract short ID from the slug and find the full UUID
  const shortId = extractArticleIdFromSlug(resolvedParams.slug)
  
  // Get all articles and filter in JavaScript to find the matching short ID
  const { data: allArticles, error: searchError } = await supabase
    .from('articles')
    .select('title, article_preview_text, image, id')
  
  if (searchError || !allArticles) {
    return {
      title: 'Article Not Found'
    }
  }
  
  // Find the exact match by comparing the short ID
  const article = allArticles.find(a => a.id.replace(/-/g, '').substring(0, 6) === shortId)

  if (!article) {
    return {
      title: 'Article Not Found'
    }
  }

  return {
    title: article.title,
    description: article.article_preview_text || 'Read this article',
    openGraph: {
      title: article.title,
      description: article.article_preview_text || 'Read this article',
      images: article.image ? [{ url: article.image }] : [],
    },
  }
}