'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, Eye } from 'lucide-react'
import { BookmarkButton } from '@/components/bookmark-button'
import { formatDistanceToNow } from '@/lib/date-utils'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, memo, useMemo } from 'react'
import { generateArticleUrlWithCategory, categoryIdToSlug } from '@/lib/url-utils'
import { cn } from '@/lib/utils'
import { DisplayLanguage } from '@/hooks/use-article-feed'

export interface Article {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  description?: string
  author_name: string
  author_handle?: string
  author_profile_image?: string
  author_avatar?: string
  featured_image_url?: string
  image?: string
  article_image?: string
  article_published_at?: string
  created_at: string
  tags: string[]
  article_url?: string
  tweet_id?: string
  tweet_text?: string
  tweet_published_at?: string
  tweet_views?: number
  tweet_replies?: number
  tweet_retweets?: number
  tweet_likes?: number
  tweet_bookmarks?: number
  article_preview_text?: string
  full_article_content?: string
  updated_at?: string
  summary_chinese?: string
  summary_english?: string
  summary_generated_at?: string
  language?: string
  title_english?: string
  article_preview_text_english?: string
  category?: string
  main_category?: string
  sub_category?: string
  article_images?: string[]
  article_videos?: string[]
  source_type?: 'auto' | 'manual'
  indexed?: boolean
  score?: number
}

interface ArticleCardProps {
  article: Article
  className?: string
  index?: number
  priority?: boolean
  displayLanguage?: DisplayLanguage
}

export function ArticleCard({ article, className, index = 0, priority = false, displayLanguage = 'en' }: ArticleCardProps) {
  const languageFromDB = article.language
  const authorInitials = useMemo(() =>
    article.author_name
      ? article.author_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
      : 'UN',
    [article.author_name]
  )

  const publishedDate = article.article_published_at || article.created_at
  const [relativeTime, setRelativeTime] = useState<string>('')

  useEffect(() => {
    if (publishedDate && !isNaN(new Date(publishedDate).getTime())) {
      setRelativeTime(formatDistanceToNow(new Date(publishedDate), { addSuffix: true }))
    }
  }, [publishedDate])

  const authorHandle = article.author_handle || 'unknown'

  // Language-based display logic
  const displayTitle = displayLanguage === 'en'
    ? (article.title_english || article.title)
    : article.title

  const previewText = displayLanguage === 'en'
    ? article.summary_english
    : article.summary_chinese

  const truncatedPreview = previewText
    ? (previewText.length > 120 ? previewText.substring(0, 120) + '...' : previewText)
    : null

  const avatarUrl = article.author_profile_image || article.author_avatar
  const coverUrl = (article.article_images && article.article_images.length > 0 ? article.article_images[0] : null) ||
                   article.article_image ||
                   article.featured_image_url ||
                   article.image
  const category = article.category || 'tech:ai'
  const articleUrl = generateArticleUrlWithCategory(article.title, article.slug, category)

  return (
    <div className={cn(
      "group relative flex flex-col h-full rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10",
      className
    )}>
      {/* Cover Image */}
      {coverUrl && (
        <Link href={articleUrl} className="relative aspect-video overflow-hidden">
          <Image
            src={coverUrl}
            alt={displayTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            unoptimized={false}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-transparent to-transparent" />

          {languageFromDB && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] uppercase tracking-wider text-white/50">
              {languageFromDB}
            </div>
          )}
        </Link>
      )}

      <div className="flex flex-col flex-grow p-5 space-y-3">
        <div className="flex-grow space-y-2">
          <Link href={articleUrl} className="block group/title">
            <h3 className="text-base font-medium leading-tight text-white/90 group-hover/title:text-white transition-colors line-clamp-2">
              {displayTitle}
            </h3>
          </Link>

          {truncatedPreview && (
            <p className="text-sm text-white/40 leading-relaxed line-clamp-2">
              {truncatedPreview}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <Link href={`/author/${encodeURIComponent(authorHandle)}`} className="flex items-center gap-2 group/author">
              <Avatar className="h-6 w-6 border border-white/5 transition-transform group-hover/author:scale-110">
                {avatarUrl && <AvatarImage src={avatarUrl} referrerPolicy="no-referrer" />}
                <AvatarFallback className="text-[10px] bg-white/5 text-white/30">{authorInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white/60 group-hover/author:text-white transition-colors truncate max-w-[80px]">@{authorHandle}</span>
                <span className="text-[10px] text-white/20">{relativeTime.replace(' ago', '')}</span>
              </div>
            </Link>

            <div className="flex items-center gap-2 text-white/30">
              <div className="flex items-center gap-1">
                <Eye size={11} className="opacity-50" />
                <span className="text-[10px] font-medium">{article.tweet_views ? (article.tweet_views / 1000).toFixed(1) + 'k' : '0.5k'}</span>
              </div>
              <BookmarkButton articleId={article.id} variant="card" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {article.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] text-white/20 hover:text-white/40 transition-colors cursor-pointer capitalize">#{tag}</span>
              ))}
            </div>
            <Link href={article.article_url || articleUrl} className="text-[10px] uppercase tracking-wider font-bold text-white/40 hover:text-white flex items-center gap-1 transition-colors">
              Original
              <ExternalLink size={9} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Memoize ArticleCard to prevent unnecessary re-renders
export const ArticleCardMemo = memo(ArticleCard, (prevProps, nextProps) => {
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.article.tweet_views === nextProps.article.tweet_views &&
    prevProps.displayLanguage === nextProps.displayLanguage
  )
})

export function ArticleCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[2rem] bg-card border border-border overflow-hidden h-[520px] animate-pulse", className)}>
      <div className="aspect-video bg-white/5" />
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="h-3 bg-white/5 rounded w-1/4" />
          <div className="h-6 bg-white/5 rounded w-full" />
          <div className="h-6 bg-white/5 rounded w-2/3" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-full" />
        </div>
        <div className="pt-4 border-t border-border flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 rounded-full bg-white/5" />
            <div className="h-3 bg-white/5 rounded w-20" />
          </div>
          <div className="h-3 bg-white/5 rounded w-12" />
        </div>
      </div>
    </div>
  )
}
