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

  // Generate article URL - prioritize article_url
  const articleUrl = article.article_url || 
    `https://x.com/search?q=${encodeURIComponent(article.title)}`

  // Generate author handle for display
  const authorHandle = article.author_handle || 
    article.author_name.toLowerCase().replace(/\s+/g, '_')

  return (
    <Card className={`group hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Author Info with Profile Image */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {article.author_profile_image ? (
                <AvatarImage 
                  src={article.author_profile_image} 
                  alt={`${article.author_name} profile picture`}
                />
              ) : null}
              <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              {/* Author Name */}
              <span className="font-semibold text-base text-gray-900">
                {article.author_name}
              </span>
              {/* Author Handle */}
              <span className="text-sm text-gray-600 font-medium">
                @{authorHandle}
              </span>
              {/* Timestamp */}
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Clock className="h-3 w-3" />
                <time dateTime={publishedDate}>
                  {relativeTime}
                </time>
              </div>
            </div>
          </div>
          
          {/* Article Link Button */}
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 opacity-90 group-hover:opacity-100 transition-opacity"
            asChild
          >
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open article: ${article.title}`}
            >
              <ExternalLink className="h-4 w-4" />
              Read Article
            </a>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Article Title */}
          <div className="space-y-3">
            <h3 className="font-bold text-xl leading-tight text-gray-900 line-clamp-2">
              {article.title}
            </h3>
            
            {/* Article Preview Text */}
            {article.excerpt && (
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                {article.excerpt}
              </p>
            )}
          </div>

          {/* Cover Image */}
          {article.featured_image_url && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={article.featured_image_url}
                alt={`Cover image for ${article.title}`}
                className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  #{tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                  +{article.tags.length - 3} more
                </span>
              )}
            </div>
          )}


        </div>
      </CardContent>
    </Card>
  )
}

export function ArticleCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div className="flex flex-col gap-2">
              <div className="h-5 w-28 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-9 w-24 bg-gray-200 rounded" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Title Skeleton */}
          <div className="space-y-2">
            <div className="h-6 w-full bg-gray-200 rounded" />
            <div className="h-6 w-3/4 bg-gray-200 rounded" />
          </div>
          
          {/* Preview Text Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 rounded" />
            <div className="h-4 w-4/5 bg-gray-200 rounded" />
          </div>

          {/* Cover Image Skeleton */}
          <div className="aspect-video w-full bg-gray-200 rounded-lg" />

          {/* Tags Skeleton */}
          <div className="flex flex-wrap gap-1">
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
            <div className="h-6 w-14 bg-gray-200 rounded-full" />
          </div>

          {/* Article Link Skeleton */}
          <div className="pt-2 border-t border-gray-100">
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}