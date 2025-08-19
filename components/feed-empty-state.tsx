import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Search, RefreshCw } from 'lucide-react'

interface EmptyStateProps {
  type: 'no-articles' | 'no-results' | 'error'
  searchQuery?: string
  onRetry?: () => void
  onClearSearch?: () => void
}

export function FeedEmptyState({ type, searchQuery, onRetry, onClearSearch }: EmptyStateProps) {
  if (type === 'no-articles') {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Articles Yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Articles will appear here once they&apos;re imported from Twitter lists.
          </p>
          <p className="text-xs text-gray-500">
            The ingest process runs every 20 minutes to collect new articles.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (type === 'no-results') {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
          <p className="text-sm text-gray-600 mb-4">
            {searchQuery 
              ? `No articles found matching "${searchQuery}"`
              : "No articles match your current filters"
            }
          </p>
          {onClearSearch && (
            <Button variant="outline" onClick={onClearSearch}>
              Clear Search
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (type === 'error') {
    return (
      <Card className="mx-auto max-w-md border-red-200">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-red-50 p-4 mb-4">
            <RefreshCw className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-600 mb-4">
            We couldn&apos;t load the articles. Please try again.
          </p>
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}