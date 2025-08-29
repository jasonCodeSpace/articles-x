import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

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
}

interface ArticleCardProps {
  article: Article
  className?: string
}

export function ArticleCard({ article, className }: ArticleCardProps) {
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
    <div className={`px-3 py-2 border-b border-gray-800 hover:bg-gray-950/50 transition-all duration-200 group cursor-pointer ${className}`}>
      {/* Compact article card layout */}
      <div className="flex gap-2">
        {/* Smaller Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8 ring-1 ring-transparent group-hover:ring-blue-500/30 transition-all duration-200">
            {avatarUrl ? (
              <AvatarImage 
                src={avatarUrl} 
                alt={`${article.author_name} profile picture`}
                className="transition-all duration-200"
              />
            ) : null}
            <AvatarFallback className="text-xs font-medium bg-gray-600 text-white">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Compact Content */}
        <div className="flex-1 min-w-0">
          {/* Compact Header */}
          <div className="flex items-center gap-1 text-xs">
            <span className="font-medium text-white truncate hover:underline cursor-pointer">
              {article.author_name}
            </span>
            <span className="text-gray-500 truncate">
              @{authorHandle}
            </span>
            <span className="text-gray-500">·</span>
            <time className="text-gray-500 hover:underline cursor-pointer" dateTime={publishedDate} title={new Date(publishedDate).toLocaleString()}>
              {relativeTime.replace(' ago', '')}
            </time>
          </div>
          
          {/* Compact Article Content */}
          <div className="mt-1">
            {/* Article title with smaller image on the right */}
            <div className="flex gap-2">
              <div className="flex-1">
                <h3 className="text-white text-sm leading-4 font-medium line-clamp-2 group-hover:text-blue-400 transition-colors duration-200">
                  {article.title}
                </h3>
                
                {descriptionText && (
                  <p className="text-gray-400 text-xs leading-4 mt-1 line-clamp-2">
                    {descriptionText}
                  </p>
                )}
              </div>
              
              {/* Small featured image on the right */}
              {coverUrl && (
                <div className="flex-shrink-0">
                  <Image
                    src={coverUrl}
                    alt={`Cover for ${article.title}`}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-700"
                    loading="lazy"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
            
            {/* Compact article link */}
            {articleUrl && (
              <div className="mt-2">
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
            
            {/* Category and Tags */}
            {(article.category || (article.tags && article.tags.length > 0)) && (
              <div className="flex flex-wrap gap-1 mt-1">
                {article.category && (
                  <span
                    className="inline-flex items-center rounded-full bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 text-xs"
                  >
                    {article.category}
                  </span>
                )}
                {article.tags?.slice(0, 2).map((tag) => (
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