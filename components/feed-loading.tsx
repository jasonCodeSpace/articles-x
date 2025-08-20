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

