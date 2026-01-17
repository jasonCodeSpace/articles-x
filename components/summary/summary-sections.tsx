import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SummaryJson } from './types'

interface SummarySectionsProps {
  summaryJson: SummaryJson
  totalArticlesCount: number
}

export function SummarySections({ summaryJson, totalArticlesCount }: SummarySectionsProps) {
  return (
    <>
      <h2 className="sr-only">Daily Summary Overview</h2>

      {/* Article Count */}
      <Card>
        <CardHeader>
          <CardTitle>Articles Analyzed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {summaryJson?.counts?.articles_total || totalArticlesCount}
          </div>
          <p className="text-muted-foreground">articles from the past 24 hours</p>
        </CardContent>
      </Card>

      {/* Key Data Points */}
      {summaryJson?.sections?.key_data_points && (
        <Card>
          <CardHeader>
            <CardTitle>Key Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {summaryJson.sections.key_data_points.map((point, index) => (
                <li key={index}>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Watchlist */}
      {summaryJson?.sections?.watchlist && (
        <Card>
          <CardHeader>
            <CardTitle>Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {summaryJson.sections.watchlist.map((item, index) => (
                <li key={index}>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Policy, Media & Security */}
      {summaryJson?.sections?.policy_media_security && (
        <Card>
          <CardHeader>
            <CardTitle>Policy, Media & Security</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {summaryJson.sections.policy_media_security.map((item, index) => (
                <li key={index}>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Other Quick Reads */}
      {summaryJson?.sections?.other_quick_reads && (
        <Card>
          <CardHeader>
            <CardTitle>Other Quick Reads</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {summaryJson.sections.other_quick_reads.map((item, index) => (
                <li key={index}>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Domains Covered */}
      {summaryJson?.meta?.domains_covered && (
        <Card>
          <CardHeader>
            <CardTitle>Domains Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summaryJson.meta.domains_covered.map((domain, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {domain}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

interface FallbackContentProps {
  content: string
  categoriesSummary?: Record<string, unknown> | null
}

export function FallbackContent({ content, categoriesSummary }: FallbackContentProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        </CardContent>
      </Card>

      {/* Categories Summary */}
      {categoriesSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Categories Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(categoriesSummary as Record<string, number>).map(([category, count]) => (
                <div key={category} className="text-center">
                  <div className="text-lg font-semibold">{count}</div>
                  <div className="text-xs text-muted-foreground capitalize">{category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
