'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, Eye, MessageCircle, Repeat2, Heart, Bookmark, Share2, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { generateArticleUrl, generateShareableUrl } from '@/lib/url-utils'

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
  const [isShared, setIsShared] = useState(false)

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleShare = async () => {
    try {
      const shareUrl = generateShareableUrl(article.title, article.id)
      await navigator.clipboard.writeText(shareUrl)
      setIsShared(true)
      setTimeout(() => setIsShared(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }



  const authorInitials = article.author_name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const publishedDate = article.article_published_at || article.created_at
  const relativeTime = formatDistanceToNow(new Date(publishedDate), { addSuffix: true })

  // Generate author handle for display
  const authorHandle = article.author_handle || 
    article.author_name.toLowerCase().replace(/\s+/g, '_')

  // Prefer description, then excerpt, then a small slice of content
  const descriptionText = article.description || article.excerpt || article.content

  // Field fallbacks for images
  const avatarUrl = article.author_profile_image || article.author_avatar
  const coverUrl = article.featured_image_url || article.image

  // Generate article URL with meaningful title and permanent ID
  const articleUrl = generateArticleUrl(article.title, article.id)

  return (
    <div className={`bg-gray-900/80 border border-gray-700 rounded-xl overflow-hidden hover:bg-gray-900/90 hover:border-gray-600 transition-all duration-300 group cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.02] flex flex-col h-[480px] ${className}`}>
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
      <div className="p-4 flex flex-col flex-grow">
        {/* Article title */}
        <Link href={articleUrl} className="block">
          <h3 className="text-white text-lg font-semibold leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors duration-200 mb-3">
            {article.title}
          </h3>
        </Link>
        
        {/* Article preview text */}
        <div className="flex-grow">
          {(article.article_preview_text || descriptionText) && (
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4">
              {article.article_preview_text || descriptionText}
            </p>
          )}
        </div>
        
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
        
        {/* Tweet engagement stats and actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 text-xs text-gray-500">
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
          
          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors p-1 rounded hover:bg-gray-800"
            title="Share article"
          >
            {isShared ? (
              <Check className="h-3 w-3 text-green-400" />
            ) : (
              <Share2 className="h-3 w-3" />
            )}
          </button>
        </div>
        
        {/* Article link */}
        <div className="mb-3">
          <Link
            href={articleUrl}
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Read article</span>
          </Link>
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
    <div className={`bg-gray-900 rounded-lg overflow-hidden border border-gray-800 animate-pulse flex flex-col h-[480px] ${className}`}>
      {/* Image skeleton */}
      <div className="h-48 bg-gray-800 flex-shrink-0" />
      
      {/* Content skeleton */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-5 bg-gray-700 rounded w-full" />
          <div className="h-5 bg-gray-700 rounded w-3/4" />
        </div>
        
        {/* Description skeleton */}
        <div className="flex-grow space-y-2 mb-4">
          <div className="h-4 bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-700 rounded w-2/3" />
        </div>
        
        {/* Author info skeleton */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-full bg-gray-700" />
          <div className="h-3 bg-gray-700 rounded w-20" />
          <div className="h-3 bg-gray-700 rounded w-12" />
        </div>
        
        {/* Stats and actions skeleton */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-3 bg-gray-700 rounded w-8" />
            <div className="h-3 bg-gray-700 rounded w-8" />
            <div className="h-3 bg-gray-700 rounded w-8" />
          </div>
          <div className="h-3 w-3 bg-gray-700 rounded" />
        </div>
        
        {/* Link skeleton */}
        <div className="h-3 bg-gray-700 rounded w-20 mb-3" />
        
        {/* Tags skeleton */}
        <div className="flex gap-1">
          <div className="h-3 bg-gray-700 rounded w-12" />
          <div className="h-3 bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  )
}