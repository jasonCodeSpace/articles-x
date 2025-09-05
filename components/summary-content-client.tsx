'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface SummarySection {
  watchlist?: string[]
  key_data_points?: string[]
  other_quick_reads?: string[]
  policy_media_security?: string[]
}

interface SummaryJson {
  date: string
  lang: string
  meta: {
    notes: string
    domains_covered: string[]
  }
  counts: {
    articles_total: number
  }
  sections: SummarySection
}

interface DailySummary {
  id: string
  date: string
  summary_content: string
  summary_json_en: SummaryJson | null
  summary_json_zh: SummaryJson | null
  top_article_title: string
  top_article_id: string | null
  total_articles_count: number
  categories_summary: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export function SummaryContentClient({ summary }: { summary: DailySummary }) {
  const [language, setLanguage] = useState<'original' | 'english'>('english')
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const currentSummaryJson = language === 'english' ? summary.summary_json_en : summary.summary_json_zh
  const hasJsonData = currentSummaryJson && Object.keys(currentSummaryJson).length > 0

  const handleLanguageChange = (newLanguage: 'original' | 'english') => {
    setLanguage(newLanguage)
  }

  const timeAgo = formatDistanceToNow(new Date(summary.created_at), {
    addSuffix: true,
    locale: zhCN
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Daily Summary</h1>
          <p className="text-muted-foreground mb-4">{formatDate(summary.date)}</p>
        </div>
        
        {/* Author, Time Info and Language Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 ring-1 ring-border">
              <img 
                className="aspect-square h-full w-full" 
                alt="xarticle profile picture" 
                loading="lazy" 
                referrerPolicy="no-referrer" 
                src="/logo.svg"
              />
            </span>
            <Link 
              href="/summaries"
              className="font-medium text-muted-foreground truncate hover:text-foreground transition-colors"
            >
              @xarticle
            </Link>
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4">
              <span>·</span>
              <time>{timeAgo}</time>
            </div>
          </div>
          
          {/* Language Toggle */}
          <button
            onClick={() => handleLanguageChange(language === 'original' ? 'english' : 'original')}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-accent transition-colors"
          >
            {language === 'original' ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                中文
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 8l6 6"/>
                  <path d="M4 14l6-6 2-3"/>
                  <path d="M2 5h12"/>
                  <path d="M7 2h1"/>
                  <path d="M22 22l-5-10-5 10"/>
                  <path d="M14 18h6"/>
                </svg>
                English
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {hasJsonData ? (
          <>
            <h2 className="sr-only">Daily Summary Overview</h2>
            {/* Article Count */}
            <Card>
              <CardHeader>
                <CardTitle>Articles Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {currentSummaryJson?.counts?.articles_total || summary.total_articles_count}
                </div>
                <p className="text-muted-foreground">articles from the past 24 hours</p>
              </CardContent>
            </Card>

            {/* Key Data Points */}
            {currentSummaryJson?.sections?.key_data_points && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Data Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentSummaryJson.sections.key_data_points.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Watchlist */}
            {currentSummaryJson?.sections?.watchlist && (
              <Card>
                <CardHeader>
                  <CardTitle>Watchlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentSummaryJson.sections.watchlist.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Policy, Media & Security */}
            {currentSummaryJson?.sections?.policy_media_security && (
              <Card>
                <CardHeader>
                  <CardTitle>Policy, Media & Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentSummaryJson.sections.policy_media_security.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Other Quick Reads */}
            {currentSummaryJson?.sections?.other_quick_reads && (
              <Card>
                <CardHeader>
                  <CardTitle>Other Quick Reads</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentSummaryJson.sections.other_quick_reads.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Domains Covered */}
            {currentSummaryJson?.meta?.domains_covered && (
              <Card>
                <CardHeader>
                  <CardTitle>Domains Covered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentSummaryJson.meta.domains_covered.map((domain, index) => (
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