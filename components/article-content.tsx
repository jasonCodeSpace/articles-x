'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink } from 'lucide-react'
import { BookmarkButton } from '@/components/bookmark-button'
import { useRouter } from 'next/navigation'

interface ArticleContentProps {
  article: {
    id: string
    title: string
    title_english?: string
    author_name: string
    author_handle?: string
    author_avatar?: string
    article_published_at?: string
    updated_at: string
    image?: string
    category?: string
    article_url?: string
    full_article_content?: string
    full_article_content_english?: string
    summary_english?: string
    summary_chinese?: string
    summary_generated_at?: string
  }
  authorInitials: string
  authorHandle: string
  avatarUrl?: string
  publishedDate?: string
  relativeTime: string
}

export function ArticleContent({
  article,
  authorInitials,
  authorHandle,
  avatarUrl,
  publishedDate,
  relativeTime
}: ArticleContentProps) {
  const router = useRouter()

  // Use English content
  const displayTitle = article.title_english
  const displayContent = article.summary_english

  return (
    <>
      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
          {displayTitle}
        </h1>
        
        {/* Author Info */}
        <div className="flex items-center justify-between mb-4">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-accent/30 rounded-lg p-2 -m-2 transition-colors"
            onClick={() => router.push(`/author/${authorHandle}`)}
          >
            <Avatar className="h-12 w-12">
              {avatarUrl ? (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={`${article.author_name} profile picture`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <AvatarFallback className="text-sm font-medium bg-muted text-foreground">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-foreground hover:text-blue-600 transition-colors">{article.author_name}</div>
              <div className="text-sm text-muted-foreground">@{authorHandle}</div>
            </div>
          </div>
          

        </div>

        {/* Publication Date */}
        {publishedDate && (
          <div className="text-sm text-muted-foreground mb-4">
            Published {relativeTime}
          </div>
        )}




      </header>

      {/* Article Content */}
      <article>
        {displayContent ? (
          <div className="article-content">
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: displayContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br />').replace(/^/, '<p>').replace(/$/, '</p>') }}
            />
          </div>
        ) : (
          <div className="text-muted-foreground italic text-lg leading-relaxed">
            Full article content is not available.
          </div>
        )}
      </article>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Categories */}
          {article.category && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Categories:</span>
              <div className="flex flex-wrap gap-2">
                {article.category.split(',').slice(0, 2).map((cat, index) => (
                  <span key={index} className="inline-flex items-center rounded-full bg-muted text-muted-foreground border border-border px-3 py-1 text-sm">
                    {cat.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bookmark and Original Article Link */}
          <div className="flex items-center gap-4">
            <BookmarkButton articleId={article.id} variant="page" />
            {article.article_url && (
              <a
                href={article.article_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View original article</span>
              </a>
            )}
          </div>
        </div>
      </footer>
    </>
  )
}