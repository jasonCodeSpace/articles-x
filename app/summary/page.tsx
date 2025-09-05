import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DailySummary {
  id: string
  date: string
  summary_content: string
  summary_json_en: any
  summary_json_zh: any
  top_article_title: string
  top_article_id: string | null
  total_articles_count: number
  categories_summary: any
  created_at: string
  updated_at: string
}

async function getDailySummary(): Promise<DailySummary | null> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  const { data, error } = await supabase
    .from('daily_summary')
    .select('*')
    .eq('date', today)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

function SummaryContent({ summary }: { summary: DailySummary }) {
  const formattedDate = new Date(summary.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  // Use JSON data if available, otherwise fall back to text content
  const hasJsonData = summary.summary_json_en && summary.summary_json_zh
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Daily Summary - {formattedDate}
        </h1>
        <p className="text-muted-foreground">
          Today's curated articles and insights from X
        </p>
      </div>
      
      <div className="grid gap-6">
        {hasJsonData ? (
          // New JSON-based layout
          <>
            {/* Language Toggle and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{summary.summary_json_en?.counts?.articles_total || summary.total_articles_count}</div>
                  <p className="text-xs text-muted-foreground">Articles Curated</p>
                </CardContent>
              </Card>
              
              {summary.top_article_title && (
                <Card className="md:col-span-2">
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium mb-1">Top Article</div>
                    <p className="text-sm text-muted-foreground">{summary.top_article_title}</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Key Data Points */}
            {summary.summary_json_en?.sections?.key_data_points && (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Key Data Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.summary_json_en.sections.key_data_points.map((point: string, index: number) => (
                      <li key={index} className="text-sm leading-relaxed">
                        • {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {/* Watchlist */}
            {summary.summary_json_en?.sections?.watchlist && (
              <Card>
                <CardHeader>
                  <CardTitle>👀 Watchlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.summary_json_en.sections.watchlist.map((item: string, index: number) => (
                      <li key={index} className="text-sm leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {/* Policy, Media & Security */}
            {summary.summary_json_en?.sections?.policy_media_security && (
              <Card>
                <CardHeader>
                  <CardTitle>🔒 Policy, Media & Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.summary_json_en.sections.policy_media_security.map((item: string, index: number) => (
                      <li key={index} className="text-sm leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {/* Other Quick Reads */}
            {summary.summary_json_en?.sections?.other_quick_reads && (
              <Card>
                <CardHeader>
                  <CardTitle>📚 Other Quick Reads</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.summary_json_en.sections.other_quick_reads.map((item: string, index: number) => (
                      <li key={index} className="text-sm leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {/* Domains Covered */}
            {summary.summary_json_en?.meta?.domains_covered && (
              <Card>
                <CardHeader>
                  <CardTitle>🏷️ Domains Covered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {summary.summary_json_en.meta.domains_covered.map((domain: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                        {domain}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          // Fallback to original layout
          <Card>
            <CardHeader>
              <CardTitle>Today's Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{summary.summary_content}</p>
              </div>
            </CardContent>
          </Card>
        )}
         
         {/* Categories Summary - only show for fallback layout */}
        {!hasJsonData && summary.categories_summary && (
          <Card>
            <CardHeader>
              <CardTitle>Categories Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(summary.categories_summary as Record<string, number>).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <div className="text-lg font-semibold">{count}</div>
                    <div className="text-xs text-muted-foreground capitalize">{category}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function SummaryLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default async function SummaryPage() {
  const summary = await getDailySummary()
  
  if (!summary) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Summary Available</h1>
          <p className="text-muted-foreground">
            Today's summary hasn't been generated yet. Please check back later.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <Suspense fallback={<SummaryLoading />}>
      <SummaryContent summary={summary} />
    </Suspense>
  )
}

export const metadata = {
  title: 'Daily Summary | Xarticle',
  description: 'Today\'s curated articles and insights from X',
}