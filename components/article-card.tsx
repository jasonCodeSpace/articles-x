import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ExternalLink, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  author_name: string
  author_handle?: string
  author_profile_image?: string
  featured_image_url?: string
  published_at?: string
  created_at: string
  tags: string[]
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

  const publishedDate = article.published_at || article.created_at
  const relativeTime = formatDistanceToNow(new Date(publishedDate), { addSuffix: true })

  // Use the actual article URL directly
  const articleUrl = article.article_url

  // Generate author handle for display
  const authorHandle = article.author_handle || 
    article.author_name.toLowerCase().replace(/\s+/g, '_')

  return (
    <div className={`px-4 py-3 border-b border-gray-800 hover:bg-gray-950/50 transition-all duration-300 ease-out group cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 transform animate-in fade-in-0 slide-in-from-bottom-4 ${className}`}>
      {/* X.com style tweet layout */}
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all duration-300 cursor-pointer hover:scale-110">
            {article.author_profile_image ? (
              <AvatarImage 
                src={article.author_profile_image} 
                alt={`${article.author_name} profile picture`}
                className="transition-all duration-300 group-hover:brightness-110"
              />
            ) : null}
            <AvatarFallback className="text-sm font-medium bg-gray-600 text-white group-hover:bg-blue-600 transition-colors duration-300">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1 text-sm">
            <span className="font-bold text-white truncate hover:underline cursor-pointer hover:text-blue-400 transition-colors duration-200">
              {article.author_name}
            </span>
            <span className="text-gray-500 truncate group-hover:text-gray-400 transition-colors">
              @{authorHandle}
            </span>
            <span className="text-gray-500 group-hover:text-gray-400 transition-colors">·</span>
            <time className="text-gray-500 hover:underline cursor-pointer hover:text-blue-400 transition-colors duration-200" dateTime={publishedDate}>
              {relativeTime.replace(' ago', '')}
            </time>
          </div>
          
          {/* Article content */}
          <div className="mt-1">
            <h3 className="text-white text-[15px] leading-5 mb-2 group-hover:text-blue-400 transition-colors duration-200">
              {article.title}
            </h3>
            
            {article.excerpt && (
                <p className="text-gray-300 text-[15px] leading-5 mt-1 group-hover:text-gray-200 transition-colors duration-200">
                  {article.excerpt}
                </p>
              )}
            
            {/* Featured image */}
            {article.featured_image_url && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800 group-hover:border-gray-600 transition-all duration-300">
                <img
                  src={article.featured_image_url}
                  alt={`Cover image for ${article.title}`}
                  className="w-full h-auto max-h-[400px] object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}
            
            {/* Article link preview */}
            {articleUrl && (
              <div className="mt-3 border border-gray-800 rounded-2xl overflow-hidden group-hover:border-blue-500/50 transition-all duration-300">
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 hover:bg-blue-500/10 transition-all duration-200 active:scale-95"
                >
                  <div className="flex items-center gap-2 text-gray-500 text-sm group-hover:text-blue-400 transition-colors">
                    <ExternalLink className="h-4 w-4 group-hover:animate-pulse" />
                    <span>Read full article</span>
                  </div>
                </a>
              </div>
            )}
            
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer text-sm transition-all duration-200 hover:scale-110 inline-block"
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
    <div className={`px-4 py-3 animate-pulse ${className}`}>
      {/* X.com style skeleton layout */}
      <div className="flex gap-3">
        {/* Avatar skeleton */}
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-700" />
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1 min-w-0">
          {/* Header skeleton */}
          <div className="flex items-center gap-1 mb-1">
            <div className="h-4 w-20 bg-gray-700 rounded" />
            <div className="h-4 w-16 bg-gray-700 rounded" />
            <div className="h-4 w-12 bg-gray-700 rounded" />
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-full bg-gray-700 rounded" />
            <div className="h-5 w-3/4 bg-gray-700 rounded" />
            <div className="h-5 w-5/6 bg-gray-700 rounded" />
          </div>
          
          {/* Image skeleton */}
          <div className="mt-3 h-48 w-full bg-gray-700 rounded-2xl" />
          
          {/* Link skeleton */}
          <div className="mt-3 h-12 w-full bg-gray-700 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}