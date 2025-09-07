'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, Eye, Repeat2, Heart, Bookmark } from 'lucide-react'
import { BookmarkButton } from '@/components/bookmark-button'
import { formatDistanceToNow } from '@/lib/date-utils'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { generateArticleUrl } from '@/lib/url-utils'
import { useLanguage } from '@/contexts/language-context'

export interface Article {
  id: string
  title: string
  slug: string
  // content is not guaranteed to exist in all deployments; mark optional to avoid type errors
  content?: string
  excerpt?: string
  // description may exist in DB; make optional and display when available
  description?: string
  author_name: string
  author_handle?: string
  author_profile_image?: string
  // Some deployments may use author_avatar instead of author_profile_image
  author_avatar?: string
  featured_image_url?: string
  // Some deployments may use image instead of featured_image_url
  image?: string
  article_published_at?: string
  created_at: string
  tags: string[]
  // category might be absent in some DBs, keep optional
  category?: string
  article_url?: string
  // New fields from database
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
  // AI-generated summary fields
  summary_chinese?: string
  summary_english?: string
  summary_generated_at?: string
  // Language and category fields
  language?: string
  // English translation fields
  title_english?: string
  // 移除了 article_preview_text_english 和 full_article_content_english 字段
}

interface ArticleCardProps {
  article: Article
  className?: string
  index?: number
  priority?: boolean
}



export function ArticleCard({ article, className, priority = false }: ArticleCardProps) {
  const { language } = useLanguage()
  
  // 只使用数据库中的语言字段，如果没有数据则不显示语言标签
  const languageFromDB = article.language
  
  // 调试信息 - 查看实际接收到的数据
  if (process.env.NODE_ENV === 'development') {
    console.log('Article data:', {
      id: article.id,
      title: article.title?.substring(0, 50) + '...',
      language: article.language,
      category: article.category,
      languageFromDB
    })
  }






  const authorInitials = article.author_name
    ? article.author_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'UN'

  const publishedDate = article.article_published_at || article.created_at
  const [relativeTime, setRelativeTime] = useState<string>('Loading...')
  
  // Use useEffect to calculate relative time on client side to avoid hydration mismatch
  useEffect(() => {
    if (publishedDate && !isNaN(new Date(publishedDate).getTime())) {
      setRelativeTime(formatDistanceToNow(new Date(publishedDate), { addSuffix: true }))
    } else {
      setRelativeTime('Unknown time')
    }
  }, [publishedDate])

  // Use author_handle directly
  const authorHandle = article.author_handle || 'unknown'

  // Field fallbacks for content based on language preference
  const displayTitle = language === 'original' ? article.title : (article.title_english || article.title)
  const displayPreview = article.article_preview_text
  // Always prioritize article_preview_text over summaries for trending/category pages
  const descriptionText = displayPreview || article.description || article.excerpt || article.content

  // Field fallbacks for images
  const avatarUrl = article.author_profile_image || article.author_avatar
  const coverUrl = article.featured_image_url || article.image

  // Generate article URL with meaningful title and permanent ID
  const articleUrl = generateArticleUrl(article.title, article.id)

  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden hover:bg-card/90 hover:border-border/80 transition-all duration-300 group cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.02] flex flex-col h-[480px] ${className}`}>
      {/* Featured image at the top */}
      {coverUrl && (
        <Link href={articleUrl} className="relative w-full h-48 overflow-hidden block">
          <Image
            src={coverUrl}
            alt={`Cover for ${article.title}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            unoptimized
            referrerPolicy="no-referrer"
          />
          {/* Language badge - only show if language data exists in Supabase */}
          {languageFromDB && (
            <div className="absolute top-3 left-3">
              <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium backdrop-blur-sm">
                {languageFromDB.toUpperCase()}
              </span>
            </div>
          )}
          {/* Category badges */}
          {article.category && (
            <div className="absolute top-3 right-3 flex flex-nowrap gap-1 max-w-[140px] overflow-hidden">
              {article.category.split(',').slice(0, 2).map((cat, index) => (
                <span key={index} className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md font-medium whitespace-nowrap flex-shrink-0">
                  {cat.trim()}
                </span>
              ))}
            </div>
          )}
        </Link>
      )}
      
      {/* Card content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Article title */}
        <Link href={articleUrl} className="block">
          <h3 className="text-foreground text-lg font-semibold leading-tight line-clamp-2 group-hover:text-accent-foreground transition-colors duration-200 mb-3">
            {displayTitle}
          </h3>
        </Link>
        
        {/* Article preview text */}
        <div className="flex-grow">
          {descriptionText && (
            <Link href={articleUrl} className="block">
              <p className="text-muted-foreground/15 text-xs leading-relaxed line-clamp-3 mb-4 hover:text-muted-foreground/25 transition-colors cursor-pointer">
                {descriptionText}
              </p>
            </Link>
          )}
        </div>
        
        {/* Author info */}
        <div className="flex items-center gap-2 mb-3">
          <Link href={`/author/${encodeURIComponent(authorHandle)}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar className="h-6 w-6 ring-1 ring-border">
              {avatarUrl ? (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={`${article.author_name} profile picture`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <AvatarFallback className="text-xs font-medium bg-muted text-foreground">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-muted-foreground truncate hover:text-foreground transition-colors">
              @{authorHandle}
            </span>
          </Link>
          <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
            <span>·</span>
            <time dateTime={publishedDate} title={new Date(publishedDate).toLocaleString()}>
              {relativeTime.replace(' ago', '')}
            </time>
          </div>
        </div>
        
        {/* Tweet engagement stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{article.tweet_views?.toLocaleString() || '465,948'}</span>
            </div>
            {article.tweet_likes !== undefined && (
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span>{article.tweet_likes.toLocaleString()}</span>
              </div>
            )}
            {article.tweet_retweets !== undefined && (
              <div className="flex items-center gap-1">
                <Repeat2 className="h-3 w-3" />
                <span>{article.tweet_retweets.toLocaleString()}</span>
              </div>
            )}
            {article.tweet_bookmarks !== undefined && (
              <div className="flex items-center gap-1">
                <Bookmark className="h-3 w-3" />
                <span>{article.tweet_bookmarks.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <Link href={article.article_url || generateArticleUrl(article.title, article.id)}>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-xs px-3 py-1 h-7">
              <ExternalLink className="h-3 w-3" />
              Read on X
            </button>
          </Link>
          <BookmarkButton articleId={article.id} variant="card" />
        </div>
        

        
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ArticleCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-card rounded-lg overflow-hidden border border-border animate-pulse flex flex-col h-[480px] ${className}`}>
      {/* Image skeleton */}
      <div className="h-48 bg-muted flex-shrink-0" />
      
      {/* Content skeleton */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-5 bg-muted rounded w-full" />
          <div className="h-5 bg-muted rounded w-3/4" />
        </div>
        
        {/* Description skeleton */}
        <div className="flex-grow space-y-2 mb-4">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
        
        {/* Author info skeleton */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-full bg-muted" />
          <div className="h-3 bg-muted rounded w-20" />
          <div className="h-3 bg-muted rounded w-12" />
        </div>
        
        {/* Stats and actions skeleton */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-3 bg-muted rounded w-8" />
            <div className="h-3 bg-muted rounded w-8" />
            <div className="h-3 bg-muted rounded w-8" />
          </div>
          <div className="h-3 w-3 bg-muted rounded" />
        </div>
        
        {/* Link skeleton */}
        <div className="h-3 bg-muted rounded w-20 mb-3" />
        
        {/* Tags skeleton */}
        <div className="flex gap-1">
          <div className="h-3 bg-muted rounded w-12" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
    </div>
  )
}