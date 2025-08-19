import { ArticleCardSkeleton } from '@/components/article-card'

interface FeedLoadingProps {
  count?: number
}

export function FeedLoading({ count = 6 }: FeedLoadingProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ArticleCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function FeedToolbarSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-white border-b border-gray-200">
      {/* Search skeleton */}
      <div className="flex-1 max-w-md">
        <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
      </div>

      {/* Filter and sort skeletons */}
      <div className="flex items-center gap-2">
        <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
        <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse" />
      </div>
    </div>
  )
}