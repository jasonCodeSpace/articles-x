'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, Eye, MessageCircle, Repeat2, Heart, Bookmark } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

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
}

interface ArticleCardProps {
  article: Article
  className?: string
  index?: number
}

export function ArticleCard({ article, className, index = 0 }: ArticleCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }



  const authorInitials = article.author_name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const publishedDate = article.article_published_at || article.created_at
  const relativeTime = formatDistanceToNow(new Date(publishedDate), { addSuffix: true })

  // Use the actual article URL directly
  const articleUrl = article.article_url

  // Generate author handle for display
  const authorHandle = article.author_handle || 
    article.author_name.toLowerCase().replace(/\s+/g, '_')

  // Prefer description, then excerpt, then a small slice of content
  const descriptionText = article.description || article.excerpt || article.content

  // Field fallbacks for images
  const avatarUrl = article.author_profile_image || article.author_avatar
  const coverUrl = article.featured_image_url || article.image

  return (
    <div className={`bg-gray-900/80 border border-gray-700 rounded-xl overflow-hidden hover:bg-gray-900/90 hover:border-gray-600 transition-all duration-300 group cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.02] h-fit ${className}`}>
      {/* Featured image at the top */}
      {coverUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={coverUrl}
            alt={`Cover for ${article.title}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            unoptimized
            referrerPolicy="no-referrer"
          />
          {/* Language badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-gray-900/80 text-white text-xs px-2 py-1 rounded-md font-medium backdrop-blur-sm">
              EN
            </span>
          </div>
          {/* Category badge */}
          {article.category && (
            <div className="absolute top-3 right-3">
              <span className="bg-blue-600/80 text-white text-xs px-2 py-1 rounded-md font-medium backdrop-blur-sm">
                {article.category}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Card content */}
      <div className="p-4">
        {/* Article title */}
        <Link href={`/article/${article.slug}`} className="block">
          <h3 className="text-white text-lg font-semibold leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors duration-200 mb-3">
            {article.title}
          </h3>
        </Link>
        
        {/* Article preview text */}
        {(article.article_preview_text || descriptionText) && (
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4">
            {article.article_preview_text || descriptionText}
          </p>
        )}
        
        {/* Author info */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-6 w-6 ring-1 ring-gray-600">
            {avatarUrl ? (
              <AvatarImage 
                src={avatarUrl} 
                alt={`${article.author_name} profile picture`}
              />
            ) : null}
            <AvatarFallback className="text-xs font-medium bg-gray-600 text-white">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 text-xs text-gray-400 min-w-0">
            <span className="font-medium text-gray-300 truncate">
              @{authorHandle}
            </span>
            <span>·</span>
            <time dateTime={publishedDate} title={new Date(publishedDate).toLocaleString()}>
              {relativeTime.replace(' ago', '')}
            </time>
          </div>
        </div>
        
        {/* Tweet engagement stats */}
        {(article.tweet_views || article.tweet_replies || article.tweet_retweets || article.tweet_likes || article.tweet_bookmarks) && (
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            {article.tweet_views !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{article.tweet_views.toLocaleString()}</span>
              </div>
            )}
            {article.tweet_replies !== undefined && (
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{article.tweet_replies.toLocaleString()}</span>
              </div>
            )}
            {article.tweet_retweets !== undefined && (
              <div className="flex items-center gap-1">
                <Repeat2 className="h-3 w-3" />
                <span>{article.tweet_retweets.toLocaleString()}</span>
              </div>
            )}
            {article.tweet_likes !== undefined && (
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span>{article.tweet_likes.toLocaleString()}</span>
              </div>
            )}
            {article.tweet_bookmarks !== undefined && (
              <div className="flex items-center gap-1">
                <Bookmark className="h-3 w-3" />
                <span>{article.tweet_bookmarks.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Article link */}
        {articleUrl && (
          <div className="mb-3">
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Read article</span>
            </a>
          </div>
        )}
        
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
    <div className={`px-3 py-2 animate-pulse ${className}`}>
      {/* Compact skeleton layout */}
      <div className="flex gap-2">
        {/* Small avatar skeleton */}
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gray-700" />
        </div>
        
        {/* Compact content skeleton */}
        <div className="flex-1 min-w-0">
          {/* Header skeleton */}
          <div className="flex items-center gap-1 mb-1">
            <div className="h-3 w-16 bg-gray-700 rounded" />
            <div className="h-3 w-12 bg-gray-700 rounded" />
            <div className="h-3 w-8 bg-gray-700 rounded" />
          </div>
          
          {/* Content skeleton with image */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <div className="h-4 w/full bg-gray-700 rounded" />
              <div className="h-4 w-3/4 bg-gray-700 rounded" />
              <div className="h-3 w-1/2 bg-gray-700 rounded" />
            </div>
            <div className="w-16 h-16 bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}